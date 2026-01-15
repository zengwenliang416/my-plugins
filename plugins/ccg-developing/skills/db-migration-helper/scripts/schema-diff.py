#!/usr/bin/env python3
"""
数据库模式差异分析器
用法:
  python schema-diff.py --source schema_old.sql --target schema_new.sql
  python schema-diff.py --source old.sql --target new.sql --output diff.md
"""

import argparse
import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set, Tuple


@dataclass
class Column:
    """列定义"""

    name: str
    data_type: str
    nullable: bool = True
    default: Optional[str] = None
    extra: str = ""


@dataclass
class Index:
    """索引定义"""

    name: str
    columns: List[str]
    unique: bool = False


@dataclass
class Table:
    """表定义"""

    name: str
    columns: Dict[str, Column] = field(default_factory=dict)
    indexes: Dict[str, Index] = field(default_factory=dict)
    primary_key: List[str] = field(default_factory=list)


class SQLParser:
    """SQL DDL 解析器"""

    TABLE_PATTERN = re.compile(
        r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`\"]?(\w+)[`\"]?\s*\((.*?)\)\s*(?:ENGINE|;)",
        re.IGNORECASE | re.DOTALL,
    )

    COLUMN_PATTERN = re.compile(
        r"[`\"]?(\w+)[`\"]?\s+"
        r"((?:BIGINT|INT|INTEGER|SMALLINT|TINYINT|VARCHAR|CHAR|TEXT|LONGTEXT|MEDIUMTEXT|"
        r"DATETIME|TIMESTAMP|DATE|TIME|DECIMAL|FLOAT|DOUBLE|BOOLEAN|BOOL|ENUM|JSON|BLOB)(?:\([^)]+\))?)"
        r"(?:\s+(NOT\s+NULL|NULL))?"
        r"(?:\s+DEFAULT\s+([^,]+))?"
        r"(?:\s+(AUTO_INCREMENT|ON\s+UPDATE\s+[^,]+))?",
        re.IGNORECASE,
    )

    PRIMARY_KEY_PATTERN = re.compile(r"PRIMARY\s+KEY\s*\(([^)]+)\)", re.IGNORECASE)

    INDEX_PATTERN = re.compile(
        r"(?:UNIQUE\s+)?(?:INDEX|KEY)\s+[`\"]?(\w+)[`\"]?\s*\(([^)]+)\)",
        re.IGNORECASE,
    )

    def parse(self, sql: str) -> Dict[str, Table]:
        """解析 SQL DDL"""
        tables = {}

        for match in self.TABLE_PATTERN.finditer(sql):
            table_name = match.group(1).lower()
            table_body = match.group(2)

            table = Table(name=table_name)

            # 解析列
            for col_match in self.COLUMN_PATTERN.finditer(table_body):
                col_name = col_match.group(1).lower()
                if col_name in ("primary", "unique", "index", "key", "constraint"):
                    continue

                column = Column(
                    name=col_name,
                    data_type=col_match.group(2).upper(),
                    nullable="NOT NULL" not in (col_match.group(3) or "").upper(),
                    default=col_match.group(4),
                    extra=col_match.group(5) or "",
                )
                table.columns[col_name] = column

            # 解析主键
            pk_match = self.PRIMARY_KEY_PATTERN.search(table_body)
            if pk_match:
                table.primary_key = [
                    col.strip().strip('`"').lower()
                    for col in pk_match.group(1).split(",")
                ]

            # 解析索引
            for idx_match in self.INDEX_PATTERN.finditer(table_body):
                idx_name = idx_match.group(1).lower()
                columns = [
                    col.strip().strip('`"').lower()
                    for col in idx_match.group(2).split(",")
                ]
                is_unique = (
                    "UNIQUE"
                    in table_body[
                        max(0, idx_match.start() - 20) : idx_match.start()
                    ].upper()
                )

                table.indexes[idx_name] = Index(
                    name=idx_name, columns=columns, unique=is_unique
                )

            tables[table_name] = table

        return tables


@dataclass
class SchemaDiff:
    """模式差异"""

    added_tables: List[str] = field(default_factory=list)
    removed_tables: List[str] = field(default_factory=list)
    modified_tables: Dict[str, dict] = field(default_factory=dict)


def compare_columns(
    old_cols: Dict[str, Column], new_cols: Dict[str, Column]
) -> Tuple[List[str], List[str], Dict[str, dict]]:
    """比较列差异"""
    added = []
    removed = []
    modified = {}

    old_names = set(old_cols.keys())
    new_names = set(new_cols.keys())

    # 新增列
    added = list(new_names - old_names)

    # 删除列
    removed = list(old_names - new_names)

    # 修改列
    for name in old_names & new_names:
        old_col = old_cols[name]
        new_col = new_cols[name]

        changes = {}
        if old_col.data_type != new_col.data_type:
            changes["data_type"] = (old_col.data_type, new_col.data_type)
        if old_col.nullable != new_col.nullable:
            changes["nullable"] = (old_col.nullable, new_col.nullable)
        if old_col.default != new_col.default:
            changes["default"] = (old_col.default, new_col.default)

        if changes:
            modified[name] = changes

    return added, removed, modified


def compare_indexes(
    old_indexes: Dict[str, Index], new_indexes: Dict[str, Index]
) -> Tuple[List[str], List[str], Dict[str, dict]]:
    """比较索引差异"""
    added = []
    removed = []
    modified = {}

    old_names = set(old_indexes.keys())
    new_names = set(new_indexes.keys())

    added = list(new_names - old_names)
    removed = list(old_names - new_names)

    for name in old_names & new_names:
        old_idx = old_indexes[name]
        new_idx = new_indexes[name]

        if old_idx.columns != new_idx.columns or old_idx.unique != new_idx.unique:
            modified[name] = {
                "columns": (old_idx.columns, new_idx.columns),
                "unique": (old_idx.unique, new_idx.unique),
            }

    return added, removed, modified


def compare_schemas(
    old_tables: Dict[str, Table], new_tables: Dict[str, Table]
) -> SchemaDiff:
    """比较两个模式"""
    diff = SchemaDiff()

    old_names = set(old_tables.keys())
    new_names = set(new_tables.keys())

    # 新增表
    diff.added_tables = list(new_names - old_names)

    # 删除表
    diff.removed_tables = list(old_names - new_names)

    # 修改表
    for name in old_names & new_names:
        old_table = old_tables[name]
        new_table = new_tables[name]

        table_diff = {}

        # 比较列
        added_cols, removed_cols, modified_cols = compare_columns(
            old_table.columns, new_table.columns
        )
        if added_cols:
            table_diff["added_columns"] = added_cols
        if removed_cols:
            table_diff["removed_columns"] = removed_cols
        if modified_cols:
            table_diff["modified_columns"] = modified_cols

        # 比较索引
        added_idx, removed_idx, modified_idx = compare_indexes(
            old_table.indexes, new_table.indexes
        )
        if added_idx:
            table_diff["added_indexes"] = added_idx
        if removed_idx:
            table_diff["removed_indexes"] = removed_idx
        if modified_idx:
            table_diff["modified_indexes"] = modified_idx

        # 比较主键
        if old_table.primary_key != new_table.primary_key:
            table_diff["primary_key"] = (
                old_table.primary_key,
                new_table.primary_key,
            )

        if table_diff:
            diff.modified_tables[name] = table_diff

    return diff


def generate_migration_sql(
    diff: SchemaDiff, old_tables: Dict[str, Table], new_tables: Dict[str, Table]
) -> str:
    """生成迁移 SQL"""
    lines = []
    lines.append("-- 自动生成的迁移 SQL")
    lines.append("-- 请在执行前仔细检查！")
    lines.append("")

    # 新增表
    for table_name in diff.added_tables:
        table = new_tables[table_name]
        lines.append(f"-- 新增表: {table_name}")
        col_defs = []
        for col in table.columns.values():
            col_def = f"  {col.name} {col.data_type}"
            if not col.nullable:
                col_def += " NOT NULL"
            if col.default:
                col_def += f" DEFAULT {col.default}"
            col_defs.append(col_def)

        if table.primary_key:
            col_defs.append(f"  PRIMARY KEY ({', '.join(table.primary_key)})")

        lines.append(f"CREATE TABLE {table_name} (")
        lines.append(",\n".join(col_defs))
        lines.append(");")
        lines.append("")

    # 删除表
    for table_name in diff.removed_tables:
        lines.append(f"-- 删除表: {table_name}")
        lines.append(f"DROP TABLE IF EXISTS {table_name};")
        lines.append("")

    # 修改表
    for table_name, changes in diff.modified_tables.items():
        lines.append(f"-- 修改表: {table_name}")

        # 新增列
        for col_name in changes.get("added_columns", []):
            col = new_tables[table_name].columns[col_name]
            lines.append(
                f"ALTER TABLE {table_name} ADD COLUMN {col.name} {col.data_type}"
                + (" NOT NULL" if not col.nullable else "")
                + (f" DEFAULT {col.default}" if col.default else "")
                + ";"
            )

        # 删除列
        for col_name in changes.get("removed_columns", []):
            lines.append(f"ALTER TABLE {table_name} DROP COLUMN {col_name};")

        # 修改列
        for col_name, col_changes in changes.get("modified_columns", {}).items():
            col = new_tables[table_name].columns[col_name]
            lines.append(
                f"ALTER TABLE {table_name} MODIFY COLUMN {col.name} {col.data_type}"
                + (" NOT NULL" if not col.nullable else " NULL")
                + (f" DEFAULT {col.default}" if col.default else "")
                + ";"
            )

        # 新增索引
        for idx_name in changes.get("added_indexes", []):
            idx = new_tables[table_name].indexes[idx_name]
            unique = "UNIQUE " if idx.unique else ""
            lines.append(
                f"CREATE {unique}INDEX {idx_name} ON {table_name} ({', '.join(idx.columns)});"
            )

        # 删除索引
        for idx_name in changes.get("removed_indexes", []):
            lines.append(f"DROP INDEX {idx_name} ON {table_name};")

        lines.append("")

    return "\n".join(lines)


def generate_report(
    diff: SchemaDiff, old_tables: Dict[str, Table], new_tables: Dict[str, Table]
) -> str:
    """生成差异报告"""
    lines = []
    lines.append("# 数据库模式差异报告")
    lines.append("")

    # 统计
    total_changes = (
        len(diff.added_tables) + len(diff.removed_tables) + len(diff.modified_tables)
    )
    lines.append("## 变更统计")
    lines.append(f"- 新增表: {len(diff.added_tables)}")
    lines.append(f"- 删除表: {len(diff.removed_tables)}")
    lines.append(f"- 修改表: {len(diff.modified_tables)}")
    lines.append(f"- **总变更数: {total_changes}**")
    lines.append("")

    if not total_changes:
        lines.append("没有检测到差异。")
        return "\n".join(lines)

    # 新增表
    if diff.added_tables:
        lines.append("## 新增表")
        for name in diff.added_tables:
            lines.append(f"### {name}")
            table = new_tables[name]
            lines.append("| 列名 | 类型 | 可空 | 默认值 |")
            lines.append("|------|------|------|--------|")
            for col in table.columns.values():
                nullable = "是" if col.nullable else "否"
                default = col.default or "-"
                lines.append(
                    f"| {col.name} | {col.data_type} | {nullable} | {default} |"
                )
            lines.append("")

    # 删除表
    if diff.removed_tables:
        lines.append("## ⚠️ 删除表")
        for name in diff.removed_tables:
            lines.append(f"- `{name}`")
        lines.append("")

    # 修改表
    if diff.modified_tables:
        lines.append("## 修改表")
        for name, changes in diff.modified_tables.items():
            lines.append(f"### {name}")

            if "added_columns" in changes:
                lines.append("**新增列:**")
                for col_name in changes["added_columns"]:
                    col = new_tables[name].columns[col_name]
                    lines.append(f"- `{col.name}` ({col.data_type})")

            if "removed_columns" in changes:
                lines.append("**删除列:**")
                for col_name in changes["removed_columns"]:
                    lines.append(f"- `{col_name}`")

            if "modified_columns" in changes:
                lines.append("**修改列:**")
                for col_name, col_changes in changes["modified_columns"].items():
                    lines.append(f"- `{col_name}`:")
                    for attr, (old_val, new_val) in col_changes.items():
                        lines.append(f"  - {attr}: `{old_val}` → `{new_val}`")

            lines.append("")

    # 迁移 SQL
    lines.append("## 迁移 SQL")
    lines.append("```sql")
    lines.append(generate_migration_sql(diff, old_tables, new_tables))
    lines.append("```")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="数据库模式差异分析器")
    parser.add_argument("--source", type=str, required=True, help="源模式文件")
    parser.add_argument("--target", type=str, required=True, help="目标模式文件")
    parser.add_argument("--output", type=str, help="输出文件路径")
    parser.add_argument("--sql-only", action="store_true", help="只输出迁移 SQL")
    args = parser.parse_args()

    print("==================================================")
    print("数据库模式差异分析器")
    print("==================================================")
    print(f"源文件: {args.source}")
    print(f"目标文件: {args.target}")
    print("")

    # 读取文件
    with open(args.source, "r", encoding="utf-8") as f:
        old_sql = f.read()

    with open(args.target, "r", encoding="utf-8") as f:
        new_sql = f.read()

    # 解析
    sql_parser = SQLParser()
    old_tables = sql_parser.parse(old_sql)
    new_tables = sql_parser.parse(new_sql)

    print(f"源模式表数: {len(old_tables)}")
    print(f"目标模式表数: {len(new_tables)}")
    print("")

    # 比较
    diff = compare_schemas(old_tables, new_tables)

    # 生成输出
    if args.sql_only:
        output = generate_migration_sql(diff, old_tables, new_tables)
    else:
        output = generate_report(diff, old_tables, new_tables)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"✅ 报告已保存: {args.output}")
    else:
        print(output)


if __name__ == "__main__":
    main()
