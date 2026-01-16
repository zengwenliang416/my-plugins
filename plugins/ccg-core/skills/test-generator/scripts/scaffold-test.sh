#!/bin/bash
# 测试文件脚手架生成器
# 用法:
#   bash scaffold-test.sh --source ./src/services/UserService.ts --framework jest
#   bash scaffold-test.sh --source ./src/user_service.py --framework pytest

set -e

# 默认值
SOURCE=""
FRAMEWORK=""
OUTPUT=""

# 帮助信息
show_help() {
    echo "测试文件脚手架生成器"
    echo ""
    echo "用法:"
    echo "  bash scaffold-test.sh --source <file> --framework <type> [--output <file>]"
    echo ""
    echo "参数:"
    echo "  --source     源代码文件路径"
    echo "  --framework  测试框架: jest, vitest, pytest, go"
    echo "  --output     输出文件路径 (可选，自动生成)"
    echo ""
    echo "示例:"
    echo "  bash scaffold-test.sh --source ./src/UserService.ts --framework jest"
    echo "  bash scaffold-test.sh --source ./src/user_service.py --framework pytest"
}

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --source)
            SOURCE="$2"
            shift 2
            ;;
        --framework)
            FRAMEWORK="$2"
            shift 2
            ;;
        --output)
            OUTPUT="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

# 验证参数
if [ -z "$SOURCE" ]; then
    echo "错误: 请指定 --source"
    exit 1
fi

if [ -z "$FRAMEWORK" ]; then
    echo "错误: 请指定 --framework"
    exit 1
fi

if [ ! -f "$SOURCE" ]; then
    echo "错误: 源文件不存在: $SOURCE"
    exit 1
fi

# 提取文件名
BASENAME=$(basename "$SOURCE")
FILENAME="${BASENAME%.*}"
EXTENSION="${BASENAME##*.}"
DIRNAME=$(dirname "$SOURCE")

# 转换命名
to_pascal_case() {
    echo "$1" | sed -r 's/(^|_|-)([a-z])/\U\2/g'
}

to_snake_case() {
    echo "$1" | sed -r 's/([A-Z])/_\L\1/g' | sed 's/^_//'
}

PASCAL_NAME=$(to_pascal_case "$FILENAME")
SNAKE_NAME=$(to_snake_case "$FILENAME")

# 生成输出路径
if [ -z "$OUTPUT" ]; then
    case $FRAMEWORK in
        jest|vitest)
            OUTPUT="${DIRNAME}/__tests__/${FILENAME}.test.${EXTENSION}"
            ;;
        pytest)
            OUTPUT="${DIRNAME}/tests/test_${SNAKE_NAME}.py"
            ;;
        go)
            OUTPUT="${DIRNAME}/${FILENAME}_test.go"
            ;;
    esac
fi

echo "=================================================="
echo "测试脚手架生成器"
echo "=================================================="
echo "源文件: $SOURCE"
echo "框架: $FRAMEWORK"
echo "输出: $OUTPUT"
echo ""

# 创建目录
mkdir -p "$(dirname "$OUTPUT")"

# 生成 Jest 测试
generate_jest() {
    cat > "$OUTPUT" << EOF
import { ${PASCAL_NAME} } from '../${FILENAME}';

// Mock 依赖
// jest.mock('../dependencies');

describe('${PASCAL_NAME}', () => {
  let instance: ${PASCAL_NAME};
  // let mockDependency: jest.Mocked<Dependency>;

  beforeEach(() => {
    jest.clearAllMocks();
    // 初始化实例和 mock
    // mockDependency = new Dependency() as jest.Mocked<Dependency>;
    // instance = new ${PASCAL_NAME}(mockDependency);
  });

  afterEach(() => {
    // 清理
  });

  describe('constructor', () => {
    it('should create instance', () => {
      // Arrange & Act
      // const result = new ${PASCAL_NAME}();

      // Assert
      // expect(result).toBeDefined();
    });
  });

  // TODO: 为每个公开方法添加测试
  describe('methodName', () => {
    describe('when valid input', () => {
      it('should return expected result', async () => {
        // Arrange
        const input = {};
        // mockDependency.method.mockResolvedValue({});

        // Act
        // const result = await instance.methodName(input);

        // Assert
        // expect(result).toBeDefined();
        // expect(mockDependency.method).toHaveBeenCalledWith(input);
      });
    });

    describe('when invalid input', () => {
      it('should throw error', async () => {
        // Arrange
        const invalidInput = {};

        // Act & Assert
        // await expect(instance.methodName(invalidInput)).rejects.toThrow();
      });
    });

    describe('edge cases', () => {
      it.each([
        // [input, expected],
        // [null, error],
        // [undefined, error],
        // ['', error],
      ])('should handle %s', async (input, expected) => {
        // Act & Assert
      });
    });
  });
});
EOF
}

# 生成 Vitest 测试
generate_vitest() {
    cat > "$OUTPUT" << EOF
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ${PASCAL_NAME} } from '../${FILENAME}';

// Mock 依赖
// vi.mock('../dependencies');

describe('${PASCAL_NAME}', () => {
  let instance: ${PASCAL_NAME};

  beforeEach(() => {
    vi.clearAllMocks();
    // 初始化
  });

  afterEach(() => {
    // 清理
  });

  describe('methodName', () => {
    it('should work with valid input', async () => {
      // Arrange
      const input = {};

      // Act
      // const result = await instance.methodName(input);

      // Assert
      // expect(result).toBeDefined();
    });

    it('should throw with invalid input', async () => {
      // Arrange & Act & Assert
      // await expect(instance.methodName(null)).rejects.toThrow();
    });
  });
});
EOF
}

# 生成 Pytest 测试
generate_pytest() {
    cat > "$OUTPUT" << EOF
"""
${PASCAL_NAME} 单元测试
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch

# from ${SNAKE_NAME} import ${PASCAL_NAME}


class Test${PASCAL_NAME}:
    """${PASCAL_NAME} 测试类"""

    @pytest.fixture
    def mock_dependency(self):
        """Mock 依赖"""
        return Mock()

    @pytest.fixture
    def instance(self, mock_dependency):
        """创建被测实例"""
        # return ${PASCAL_NAME}(mock_dependency)
        pass

    class TestInit:
        """测试初始化"""

        def test_create_instance(self):
            """应该成功创建实例"""
            # Arrange & Act
            # result = ${PASCAL_NAME}()

            # Assert
            # assert result is not None
            pass

    class TestMethodName:
        """测试 method_name 方法"""

        def test_success_with_valid_input(self, instance, mock_dependency):
            """有效输入应该返回预期结果"""
            # Arrange
            input_data = {}
            # mock_dependency.method.return_value = {}

            # Act
            # result = instance.method_name(input_data)

            # Assert
            # assert result is not None
            # mock_dependency.method.assert_called_once_with(input_data)
            pass

        def test_raises_error_with_invalid_input(self, instance):
            """无效输入应该抛出错误"""
            # Arrange
            invalid_input = None

            # Act & Assert
            # with pytest.raises(ValueError):
            #     instance.method_name(invalid_input)
            pass

        @pytest.mark.parametrize('input_value,expected', [
            # (valid_input, expected_output),
            # (edge_case, expected_output),
        ])
        def test_edge_cases(self, instance, input_value, expected):
            """边界情况测试"""
            # Act
            # result = instance.method_name(input_value)

            # Assert
            # assert result == expected
            pass


class TestAsyncMethod:
    """异步方法测试"""

    @pytest.fixture
    def mock_async_dependency(self):
        """异步 Mock"""
        mock = AsyncMock()
        return mock

    @pytest.mark.asyncio
    async def test_async_operation(self, mock_async_dependency):
        """测试异步操作"""
        # Arrange
        # mock_async_dependency.fetch.return_value = {}

        # Act
        # result = await async_function()

        # Assert
        # assert result is not None
        pass
EOF
}

# 生成 Go 测试
generate_go() {
    PACKAGE=$(head -1 "$SOURCE" | grep -oP 'package \K\w+' || echo "main")

    cat > "$OUTPUT" << EOF
package ${PACKAGE}

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

// Mock 依赖
type MockDependency struct {
    mock.Mock
}

func (m *MockDependency) Method(input string) (string, error) {
    args := m.Called(input)
    return args.String(0), args.Error(1)
}

func Test${PASCAL_NAME}_MethodName(t *testing.T) {
    t.Run("success with valid input", func(t *testing.T) {
        // Arrange
        mockDep := new(MockDependency)
        // instance := New${PASCAL_NAME}(mockDep)
        input := "test"
        mockDep.On("Method", input).Return("result", nil)

        // Act
        // result, err := instance.MethodName(input)

        // Assert
        // assert.NoError(t, err)
        // assert.Equal(t, "expected", result)
        mockDep.AssertExpectations(t)
    })

    t.Run("error with invalid input", func(t *testing.T) {
        // Arrange
        mockDep := new(MockDependency)
        // instance := New${PASCAL_NAME}(mockDep)

        // Act
        // _, err := instance.MethodName("")

        // Assert
        // assert.Error(t, err)
    })
}

// Table-driven tests
func Test${PASCAL_NAME}_EdgeCases(t *testing.T) {
    tests := []struct {
        name    string
        input   string
        want    string
        wantErr bool
    }{
        {"valid input", "test", "expected", false},
        {"empty input", "", "", true},
        {"special chars", "!@#", "sanitized", false},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Arrange
            mockDep := new(MockDependency)
            // instance := New${PASCAL_NAME}(mockDep)

            // Act
            // got, err := instance.MethodName(tt.input)

            // Assert
            if tt.wantErr {
                // assert.Error(t, err)
            } else {
                // assert.NoError(t, err)
                // assert.Equal(t, tt.want, got)
            }
        })
    }
}
EOF
}

# 根据框架生成
case $FRAMEWORK in
    jest)
        generate_jest
        ;;
    vitest)
        generate_vitest
        ;;
    pytest)
        generate_pytest
        ;;
    go)
        generate_go
        ;;
    *)
        echo "错误: 不支持的框架 '$FRAMEWORK'"
        echo "支持: jest, vitest, pytest, go"
        exit 1
        ;;
esac

echo "✅ 测试文件已生成: $OUTPUT"
echo ""
echo "后续步骤:"
echo "  1. 取消注释并修改 import 语句"
echo "  2. 添加实际的 mock 依赖"
echo "  3. 填充测试用例"
echo "  4. 运行测试验证"
