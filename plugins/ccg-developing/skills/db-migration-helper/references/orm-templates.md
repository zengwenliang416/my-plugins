# ORM 迁移模板库

各 ORM 框架的迁移脚本模板。

---

## Prisma (TypeScript/JavaScript)

### Schema 定义

```prisma
// prisma/schema.prisma
model User {
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
}

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}
```

### 命令

```bash
# 生成迁移
npx prisma migrate dev --name add_user_table

# 应用迁移
npx prisma migrate deploy

# 回滚（手动）
npx prisma migrate resolve --rolled-back add_user_table
```

---

## TypeORM (TypeScript)

```typescript
// migrations/1234567890-CreateUserTable.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUserTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "users",
        columns: [
          {
            name: "id",
            type: "bigint",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isUnique: true,
          },
          {
            name: "username",
            type: "varchar",
            length: "50",
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
          },
          {
            name: "status",
            type: "enum",
            enum: ["active", "inactive", "banned"],
            default: "'active'",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "idx_users_status_created",
        columnNames: ["status", "created_at"],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("users", "idx_users_status_created");
    await queryRunner.dropTable("users");
  }
}
```

---

## Sequelize (JavaScript)

```javascript
// migrations/20240101000000-create-user.js
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "banned"),
        defaultValue: "active",
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("users", ["status", "created_at"], {
      name: "idx_users_status_created",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", "idx_users_status_created");
    await queryInterface.dropTable("users");
  },
};
```

---

## Alembic (Python/SQLAlchemy)

```python
# migrations/versions/001_create_user_table.py
"""create user table

Revision ID: 001
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('status', sa.Enum('active', 'inactive', 'banned', name='user_status'),
                  server_default='active'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(),
                  onupdate=sa.func.now()),
    )

    op.create_index('idx_users_status_created', 'users', ['status', 'created_at'])


def downgrade():
    op.drop_index('idx_users_status_created', 'users')
    op.drop_table('users')
    op.execute('DROP TYPE user_status')
```

---

## 命令速查

| ORM       | 生成迁移                             | 应用迁移                        | 回滚                                           |
| --------- | ------------------------------------ | ------------------------------- | ---------------------------------------------- |
| Prisma    | `npx prisma migrate dev --name xxx`  | `npx prisma migrate deploy`     | `npx prisma migrate resolve --rolled-back xxx` |
| TypeORM   | `npm run typeorm migration:generate` | `npm run typeorm migration:run` | `npm run typeorm migration:revert`             |
| Sequelize | `npx sequelize migration:generate`   | `npx sequelize db:migrate`      | `npx sequelize db:migrate:undo`                |
| Alembic   | `alembic revision -m "xxx"`          | `alembic upgrade head`          | `alembic downgrade -1`                         |
