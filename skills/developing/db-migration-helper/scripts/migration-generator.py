#!/usr/bin/env python3
"""
数据库迁移脚本生成器
用法:
  python migration-generator.py --orm prisma --name add_user_table
  python migration-generator.py --orm typeorm --name add_phone_to_users --type alter
  python migration-generator.py --orm alembic --name create_orders
"""

import argparse
import os
import re
from datetime import datetime
from typing import Optional


def generate_timestamp() -> str:
    """生成时间戳"""
    return datetime.now().strftime("%Y%m%d%H%M%S")


def to_pascal_case(name: str) -> str:
    """转换为 PascalCase"""
    return "".join(word.capitalize() for word in re.split(r"[_\-\s]+", name))


def to_snake_case(name: str) -> str:
    """转换为 snake_case"""
    s1 = re.sub("(.)([A-Z][a-z]+)", r"\1_\2", name)
    return re.sub("([a-z0-9])([A-Z])", r"\1_\2", s1).lower()


def generate_prisma_migration(name: str) -> str:
    """生成 Prisma schema 示例"""
    return f"""// Prisma Schema 示例
// 文件: prisma/schema.prisma
// 迁移名称: {name}

// 添加或修改以下模型定义:

model User {{
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @db.VarChar(50)
  password  String
  status    UserStatus @default(ACTIVE)
  profile   Profile?
  orders    Order[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
  @@index([status, createdAt])
}}

enum UserStatus {{
  ACTIVE
  INACTIVE
  BANNED
}}

// 运行迁移命令:
// npx prisma migrate dev --name {name}

// 生产环境部署:
// npx prisma migrate deploy

// 回滚 (手动):
// npx prisma migrate resolve --rolled-back {name}
"""


def generate_typeorm_migration(name: str, migration_type: str = "create") -> str:
    """生成 TypeORM 迁移脚本"""
    timestamp = generate_timestamp()
    class_name = to_pascal_case(name) + timestamp

    if migration_type == "create":
        return f"""import {{ MigrationInterface, QueryRunner, Table, TableIndex }} from "typeorm";

export class {class_name} implements MigrationInterface {{
  name = "{class_name}";

  public async up(queryRunner: QueryRunner): Promise<void> {{
    // 创建表
    await queryRunner.createTable(
      new Table({{
        name: "users",
        columns: [
          {{
            name: "id",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          }},
          {{
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
          }},
          {{
            name: "username",
            type: "varchar",
            length: "50",
          }},
          {{
            name: "password",
            type: "varchar",
            length: "255",
          }},
          {{
            name: "status",
            type: "enum",
            enum: ["active", "inactive", "banned"],
            default: "'active'",
          }},
          {{
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          }},
          {{
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          }},
        ],
      }}),
      true
    );

    // 创建索引
    await queryRunner.createIndex(
      "users",
      new TableIndex({{
        name: "idx_users_status_created",
        columnNames: ["status", "created_at"],
      }})
    );
  }}

  public async down(queryRunner: QueryRunner): Promise<void> {{
    await queryRunner.dropIndex("users", "idx_users_status_created");
    await queryRunner.dropTable("users");
  }}
}}
"""
    else:  # alter
        return f"""import {{ MigrationInterface, QueryRunner, TableColumn }} from "typeorm";

export class {class_name} implements MigrationInterface {{
  name = "{class_name}";

  public async up(queryRunner: QueryRunner): Promise<void> {{
    // 添加新字段
    await queryRunner.addColumn(
      "users",
      new TableColumn({{
        name: "phone",
        type: "varchar",
        length: "20",
        isNullable: true,
      }})
    );

    // 数据迁移 (可选)
    // await queryRunner.query(`
    //   UPDATE users u
    //   JOIN user_profiles p ON u.id = p.user_id
    //   SET u.phone = p.phone
    //   WHERE p.phone IS NOT NULL
    // `);
  }}

  public async down(queryRunner: QueryRunner): Promise<void> {{
    await queryRunner.dropColumn("users", "phone");
  }}
}}
"""


def generate_sequelize_migration(name: str, migration_type: str = "create") -> str:
    """生成 Sequelize 迁移脚本"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

    if migration_type == "create":
        return f""""use strict";

/** @type {{import('sequelize-cli').Migration}} */
module.exports = {{
  async up(queryInterface, Sequelize) {{
    await queryInterface.createTable("users", {{
      id: {{
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      }},
      email: {{
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      }},
      username: {{
        type: Sequelize.STRING(50),
        allowNull: false,
      }},
      password: {{
        type: Sequelize.STRING(255),
        allowNull: false,
      }},
      status: {{
        type: Sequelize.ENUM("active", "inactive", "banned"),
        defaultValue: "active",
      }},
      created_at: {{
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      }},
      updated_at: {{
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      }},
    }});

    await queryInterface.addIndex("users", ["status", "created_at"], {{
      name: "idx_users_status_created",
    }});
  }},

  async down(queryInterface, Sequelize) {{
    await queryInterface.removeIndex("users", "idx_users_status_created");
    await queryInterface.dropTable("users");
  }},
}};
"""
    else:
        return f""""use strict";

/** @type {{import('sequelize-cli').Migration}} */
module.exports = {{
  async up(queryInterface, Sequelize) {{
    await queryInterface.addColumn("users", "phone", {{
      type: Sequelize.STRING(20),
      allowNull: true,
    }});
  }},

  async down(queryInterface, Sequelize) {{
    await queryInterface.removeColumn("users", "phone");
  }},
}};
"""


def generate_alembic_migration(name: str, migration_type: str = "create") -> str:
    """生成 Alembic 迁移脚本"""
    revision = generate_timestamp()[:12]

    if migration_type == "create":
        return f'''"""
{name}

Revision ID: {revision}
Revises:
Create Date: {datetime.now().isoformat()}
"""
from alembic import op
import sqlalchemy as sa

revision = "{revision}"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("password", sa.String(255), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", "banned", name="user_status"),
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )

    op.create_index("idx_users_status_created", "users", ["status", "created_at"])


def downgrade():
    op.drop_index("idx_users_status_created", "users")
    op.drop_table("users")
    op.execute("DROP TYPE user_status")
'''
    else:
        return f'''"""
{name}

Revision ID: {revision}
Revises: <previous_revision>
Create Date: {datetime.now().isoformat()}
"""
from alembic import op
import sqlalchemy as sa

revision = "{revision}"
down_revision = "<previous_revision>"  # 替换为实际的前一个版本
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))

    # 数据迁移 (可选)
    # op.execute("""
    #     UPDATE users u
    #     JOIN user_profiles p ON u.id = p.user_id
    #     SET u.phone = p.phone
    #     WHERE p.phone IS NOT NULL
    # """)


def downgrade():
    op.drop_column("users", "phone")
'''


def generate_django_migration(name: str, migration_type: str = "create") -> str:
    """生成 Django 迁移脚本"""
    if migration_type == "create":
        return f"""# Generated migration
# {name}

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=255, unique=True)),
                ('username', models.CharField(max_length=50)),
                ('password', models.CharField(max_length=255)),
                ('status', models.CharField(
                    max_length=10,
                    choices=[('active', 'Active'), ('inactive', 'Inactive'), ('banned', 'Banned')],
                    default='active'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={{
                'db_table': 'users',
            }},
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['status', 'created_at'], name='idx_users_status_created'),
        ),
    ]
"""
    else:
        return f"""# Generated migration
# {name}

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '<previous_migration>'),  # 替换为实际依赖
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='phone',
            field=models.CharField(max_length=20, null=True, blank=True),
        ),
    ]
"""


GENERATORS = {
    "prisma": generate_prisma_migration,
    "typeorm": generate_typeorm_migration,
    "sequelize": generate_sequelize_migration,
    "alembic": generate_alembic_migration,
    "django": generate_django_migration,
}


def main():
    parser = argparse.ArgumentParser(description="数据库迁移脚本生成器")
    parser.add_argument(
        "--orm",
        type=str,
        choices=["prisma", "typeorm", "sequelize", "alembic", "django"],
        required=True,
        help="ORM 类型",
    )
    parser.add_argument("--name", type=str, required=True, help="迁移名称")
    parser.add_argument(
        "--type",
        type=str,
        choices=["create", "alter"],
        default="create",
        help="迁移类型",
    )
    parser.add_argument("--output", type=str, help="输出文件路径")
    args = parser.parse_args()

    print("==================================================")
    print("数据库迁移脚本生成器")
    print("==================================================")
    print(f"ORM: {args.orm}")
    print(f"名称: {args.name}")
    print(f"类型: {args.type}")
    print("")

    generator = GENERATORS[args.orm]

    if args.orm == "prisma":
        content = generator(args.name)
    else:
        content = generator(args.name, args.type)

    # 确定输出路径
    if not args.output:
        timestamp = generate_timestamp()
        snake_name = to_snake_case(args.name)

        if args.orm == "prisma":
            args.output = f"prisma/migrations/{timestamp}_{snake_name}/migration.sql"
        elif args.orm == "typeorm":
            args.output = f"migrations/{timestamp}-{to_pascal_case(args.name)}.ts"
        elif args.orm == "sequelize":
            args.output = f"migrations/{timestamp}-{snake_name}.js"
        elif args.orm == "alembic":
            args.output = f"migrations/versions/{timestamp[:12]}_{snake_name}.py"
        elif args.orm == "django":
            args.output = f"myapp/migrations/{timestamp[:4]}_{snake_name}.py"

    # 创建目录
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ 迁移脚本已生成: {args.output}")
    print("")
    print("后续步骤:")
    print("  1. 根据实际需求修改迁移脚本")
    print("  2. 在测试环境验证迁移")
    print("  3. 备份生产数据库")
    print("  4. 执行迁移")


if __name__ == "__main__":
    main()
