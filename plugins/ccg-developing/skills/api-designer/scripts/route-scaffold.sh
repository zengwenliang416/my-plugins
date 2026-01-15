#!/bin/bash
# API 路由脚手架生成器
# 用法:
#   bash route-scaffold.sh --resource products --framework express --output ./src/routes
#   bash route-scaffold.sh --resource products --framework fastapi --output ./src/api

set -e

# 默认值
RESOURCE=""
FRAMEWORK=""
OUTPUT_DIR="."

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --resource)
            RESOURCE="$2"
            shift 2
            ;;
        --framework)
            FRAMEWORK="$2"
            shift 2
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help)
            echo "API 路由脚手架生成器"
            echo ""
            echo "用法:"
            echo "  bash route-scaffold.sh --resource <name> --framework <type> [--output <dir>]"
            echo ""
            echo "参数:"
            echo "  --resource   资源名称 (如: products, users)"
            echo "  --framework  框架类型: express, fastapi, nestjs"
            echo "  --output     输出目录 (默认: 当前目录)"
            echo ""
            echo "示例:"
            echo "  bash route-scaffold.sh --resource products --framework express"
            echo "  bash route-scaffold.sh --resource users --framework fastapi --output ./src/api"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 验证参数
if [ -z "$RESOURCE" ]; then
    echo "错误: 请指定 --resource"
    exit 1
fi

if [ -z "$FRAMEWORK" ]; then
    echo "错误: 请指定 --framework"
    exit 1
fi

# 转换命名
to_pascal_case() {
    echo "$1" | sed -r 's/(^|_|-)([a-z])/\U\2/g'
}

to_kebab_case() {
    echo "$1" | sed -r 's/([A-Z])/-\L\1/g' | sed 's/^-//' | sed 's/_/-/g'
}

to_snake_case() {
    echo "$1" | sed -r 's/([A-Z])/_\L\1/g' | sed 's/^_//' | sed 's/-/_/g'
}

PASCAL_NAME=$(to_pascal_case "$RESOURCE")
KEBAB_NAME=$(to_kebab_case "$RESOURCE")
SNAKE_NAME=$(to_snake_case "$RESOURCE")

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

echo "=================================================="
echo "API 路由脚手架生成器"
echo "=================================================="
echo "资源: $RESOURCE"
echo "框架: $FRAMEWORK"
echo "输出: $OUTPUT_DIR"
echo ""

# Express 模板
generate_express() {
    local file="$OUTPUT_DIR/${KEBAB_NAME}.routes.ts"

    cat > "$file" << EOF
import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

// 类型定义
interface ${PASCAL_NAME} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ${PASCAL_NAME}Input {
  // TODO: 定义输入字段
}

// 中间件: 验证 ID
const validateId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '无效的 ID' });
  }
  next();
};

// GET /${KEBAB_NAME} - 获取列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    // TODO: 实现分页查询
    const data: ${PASCAL_NAME}[] = [];
    const total = 0;

    res.json({
      data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// GET /${KEBAB_NAME}/:id - 获取详情
router.get('/:id', validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: 实现查询
    const item: ${PASCAL_NAME} | null = null;

    if (!item) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// POST /${KEBAB_NAME} - 创建
router.post('/', async (req: Request, res: Response) => {
  try {
    const input: ${PASCAL_NAME}Input = req.body;

    // TODO: 验证输入
    // TODO: 创建记录

    const created: ${PASCAL_NAME} = {
      id: 'new-id',
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ${PASCAL_NAME};

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// PUT /${KEBAB_NAME}/:id - 完整更新
router.put('/:id', validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: ${PASCAL_NAME}Input = req.body;

    // TODO: 验证输入
    // TODO: 更新记录

    const updated: ${PASCAL_NAME} | null = null;

    if (!updated) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// PATCH /${KEBAB_NAME}/:id - 部分更新
router.patch('/:id', validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const input: Partial<${PASCAL_NAME}Input> = req.body;

    // TODO: 更新记录

    const updated: ${PASCAL_NAME} | null = null;

    if (!updated) {
      return res.status(404).json({ error: '未找到' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// DELETE /${KEBAB_NAME}/:id - 删除
router.delete('/:id', validateId, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: 删除记录
    const deleted = false;

    if (!deleted) {
      return res.status(404).json({ error: '未找到' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
EOF

    echo "✅ 已生成: $file"
}

# FastAPI 模板
generate_fastapi() {
    local file="$OUTPUT_DIR/${SNAKE_NAME}.py"

    cat > "$file" << EOF
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/${KEBAB_NAME}", tags=["${PASCAL_NAME}"])


# Schema 定义
class ${PASCAL_NAME}Base(BaseModel):
    """${PASCAL_NAME} 基础字段"""
    # TODO: 定义字段
    pass


class ${PASCAL_NAME}Create(${PASCAL_NAME}Base):
    """创建 ${PASCAL_NAME} 的输入"""
    pass


class ${PASCAL_NAME}Update(${PASCAL_NAME}Base):
    """更新 ${PASCAL_NAME} 的输入"""
    pass


class ${PASCAL_NAME}Patch(BaseModel):
    """部分更新 ${PASCAL_NAME} 的输入"""
    # 所有字段都是可选的
    pass


class ${PASCAL_NAME}(${PASCAL_NAME}Base):
    """${PASCAL_NAME} 响应模型"""
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ${PASCAL_NAME}List(BaseModel):
    """${PASCAL_NAME} 列表响应"""
    data: List[${PASCAL_NAME}]
    total: int
    page: int
    page_size: int


# 路由
@router.get("", response_model=${PASCAL_NAME}List)
async def list_${SNAKE_NAME}(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
):
    """获取${RESOURCE}列表"""
    # TODO: 实现分页查询
    return ${PASCAL_NAME}List(
        data=[],
        total=0,
        page=page,
        page_size=page_size,
    )


@router.get("/{id}", response_model=${PASCAL_NAME})
async def get_${SNAKE_NAME}(id: str):
    """获取${RESOURCE}详情"""
    # TODO: 实现查询
    item = None

    if not item:
        raise HTTPException(status_code=404, detail="未找到")

    return item


@router.post("", response_model=${PASCAL_NAME}, status_code=201)
async def create_${SNAKE_NAME}(data: ${PASCAL_NAME}Create):
    """创建${RESOURCE}"""
    # TODO: 实现创建
    created = ${PASCAL_NAME}(
        id="new-id",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    return created


@router.put("/{id}", response_model=${PASCAL_NAME})
async def update_${SNAKE_NAME}(id: str, data: ${PASCAL_NAME}Update):
    """更新${RESOURCE}"""
    # TODO: 实现更新
    item = None

    if not item:
        raise HTTPException(status_code=404, detail="未找到")

    return item


@router.patch("/{id}", response_model=${PASCAL_NAME})
async def patch_${SNAKE_NAME}(id: str, data: ${PASCAL_NAME}Patch):
    """部分更新${RESOURCE}"""
    # TODO: 实现部分更新
    item = None

    if not item:
        raise HTTPException(status_code=404, detail="未找到")

    return item


@router.delete("/{id}", status_code=204)
async def delete_${SNAKE_NAME}(id: str):
    """删除${RESOURCE}"""
    # TODO: 实现删除
    deleted = False

    if not deleted:
        raise HTTPException(status_code=404, detail="未找到")

    return None
EOF

    echo "✅ 已生成: $file"
}

# NestJS 模板
generate_nestjs() {
    local controller_file="$OUTPUT_DIR/${KEBAB_NAME}.controller.ts"
    local service_file="$OUTPUT_DIR/${KEBAB_NAME}.service.ts"
    local dto_file="$OUTPUT_DIR/dto/${KEBAB_NAME}.dto.ts"

    mkdir -p "$OUTPUT_DIR/dto"

    # Controller
    cat > "$controller_file" << EOF
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ${PASCAL_NAME}Service } from './${KEBAB_NAME}.service';
import {
  Create${PASCAL_NAME}Dto,
  Update${PASCAL_NAME}Dto,
  Patch${PASCAL_NAME}Dto,
  ${PASCAL_NAME}ResponseDto,
  ${PASCAL_NAME}ListDto,
  PaginationQueryDto,
} from './dto/${KEBAB_NAME}.dto';

@Controller('${KEBAB_NAME}')
export class ${PASCAL_NAME}Controller {
  constructor(private readonly ${RESOURCE}Service: ${PASCAL_NAME}Service) {}

  @Get()
  async findAll(@Query() query: PaginationQueryDto): Promise<${PASCAL_NAME}ListDto> {
    return this.${RESOURCE}Service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<${PASCAL_NAME}ResponseDto> {
    const item = await this.${RESOURCE}Service.findOne(id);
    if (!item) {
      throw new NotFoundException('未找到');
    }
    return item;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: Create${PASCAL_NAME}Dto): Promise<${PASCAL_NAME}ResponseDto> {
    return this.${RESOURCE}Service.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Update${PASCAL_NAME}Dto,
  ): Promise<${PASCAL_NAME}ResponseDto> {
    const item = await this.${RESOURCE}Service.update(id, dto);
    if (!item) {
      throw new NotFoundException('未找到');
    }
    return item;
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() dto: Patch${PASCAL_NAME}Dto,
  ): Promise<${PASCAL_NAME}ResponseDto> {
    const item = await this.${RESOURCE}Service.patch(id, dto);
    if (!item) {
      throw new NotFoundException('未找到');
    }
    return item;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    const deleted = await this.${RESOURCE}Service.remove(id);
    if (!deleted) {
      throw new NotFoundException('未找到');
    }
  }
}
EOF

    # Service
    cat > "$service_file" << EOF
import { Injectable } from '@nestjs/common';
import {
  Create${PASCAL_NAME}Dto,
  Update${PASCAL_NAME}Dto,
  Patch${PASCAL_NAME}Dto,
  ${PASCAL_NAME}ResponseDto,
  ${PASCAL_NAME}ListDto,
  PaginationQueryDto,
} from './dto/${KEBAB_NAME}.dto';

@Injectable()
export class ${PASCAL_NAME}Service {
  async findAll(query: PaginationQueryDto): Promise<${PASCAL_NAME}ListDto> {
    const { page = 1, pageSize = 20 } = query;

    // TODO: 实现分页查询

    return {
      data: [],
      total: 0,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<${PASCAL_NAME}ResponseDto | null> {
    // TODO: 实现查询
    return null;
  }

  async create(dto: Create${PASCAL_NAME}Dto): Promise<${PASCAL_NAME}ResponseDto> {
    // TODO: 实现创建
    return {
      id: 'new-id',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ${PASCAL_NAME}ResponseDto;
  }

  async update(id: string, dto: Update${PASCAL_NAME}Dto): Promise<${PASCAL_NAME}ResponseDto | null> {
    // TODO: 实现更新
    return null;
  }

  async patch(id: string, dto: Patch${PASCAL_NAME}Dto): Promise<${PASCAL_NAME}ResponseDto | null> {
    // TODO: 实现部分更新
    return null;
  }

  async remove(id: string): Promise<boolean> {
    // TODO: 实现删除
    return false;
  }
}
EOF

    # DTO
    cat > "$dto_file" << EOF
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class Create${PASCAL_NAME}Dto {
  // TODO: 定义创建字段
}

export class Update${PASCAL_NAME}Dto {
  // TODO: 定义更新字段
}

export class Patch${PASCAL_NAME}Dto {
  // TODO: 定义部分更新字段 (所有字段可选)
}

export class ${PASCAL_NAME}ResponseDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ${PASCAL_NAME}ListDto {
  data: ${PASCAL_NAME}ResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
EOF

    echo "✅ 已生成: $controller_file"
    echo "✅ 已生成: $service_file"
    echo "✅ 已生成: $dto_file"
}

# 根据框架生成
case $FRAMEWORK in
    express)
        generate_express
        ;;
    fastapi)
        generate_fastapi
        ;;
    nestjs)
        generate_nestjs
        ;;
    *)
        echo "错误: 不支持的框架 '$FRAMEWORK'"
        echo "支持: express, fastapi, nestjs"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "生成完成!"
echo "=================================================="
