# 测试模式集合

## 测试结构模式

### AAA 模式 (Arrange-Act-Assert)

```python
def test_user_creation():
    # Arrange - 准备测试数据
    user_data = {"name": "Alice", "email": "alice@example.com"}

    # Act - 执行被测操作
    user = User.create(**user_data)

    # Assert - 验证结果
    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    assert user.id is not None
```

### Given-When-Then 模式

```python
def test_order_discount():
    # Given - 给定前置条件
    order = Order(total=100)
    customer = Customer(membership="gold")

    # When - 当执行某操作
    discount = order.calculate_discount(customer)

    # Then - 那么应该得到
    assert discount == 15.0  # Gold 会员 15% 折扣
```

### 四阶段测试模式

```python
class TestDatabase:
    def setup_method(self):
        """1. Setup - 准备测试环境"""
        self.db = Database(":memory:")
        self.db.create_tables()

    def test_insert_and_query(self):
        """2. Exercise - 执行测试"""
        self.db.insert("users", {"name": "Bob"})

        """3. Verify - 验证结果"""
        result = self.db.query("users", {"name": "Bob"})
        assert len(result) == 1

    def teardown_method(self):
        """4. Teardown - 清理环境"""
        self.db.close()
```

## 测试数据模式

### Object Mother

```python
class UserMother:
    """创建测试用 User 对象的工厂"""

    @staticmethod
    def basic_user():
        return User(name="Test User", email="test@example.com")

    @staticmethod
    def admin_user():
        return User(name="Admin", email="admin@example.com", role="admin")

    @staticmethod
    def inactive_user():
        user = UserMother.basic_user()
        user.is_active = False
        return user

# 使用
def test_admin_permissions():
    admin = UserMother.admin_user()
    assert admin.can_delete_users()
```

### Builder Pattern for Tests

```python
class UserBuilder:
    def __init__(self):
        self._user = User()
        self._user.name = "Default"
        self._user.email = "default@example.com"

    def with_name(self, name: str) -> "UserBuilder":
        self._user.name = name
        return self

    def with_email(self, email: str) -> "UserBuilder":
        self._user.email = email
        return self

    def as_admin(self) -> "UserBuilder":
        self._user.role = "admin"
        return self

    def inactive(self) -> "UserBuilder":
        self._user.is_active = False
        return self

    def build(self) -> User:
        return self._user

# 使用
def test_specific_user():
    user = (
        UserBuilder()
        .with_name("Alice")
        .as_admin()
        .build()
    )
    assert user.name == "Alice"
    assert user.role == "admin"
```

### Faker for Random Data

```python
from faker import Faker

fake = Faker('zh_CN')

def create_random_user():
    return User(
        name=fake.name(),
        email=fake.email(),
        phone=fake.phone_number(),
        address=fake.address()
    )

def test_many_users():
    users = [create_random_user() for _ in range(100)]
    for user in users:
        assert user.is_valid()
```

## Mock 和 Stub 模式

### Stub

```python
class StubPaymentGateway:
    """总是返回成功的支付网关 Stub"""

    def process_payment(self, amount: float) -> dict:
        return {"status": "success", "transaction_id": "stub-123"}

def test_order_with_stub_payment():
    gateway = StubPaymentGateway()
    order = Order(total=100)

    result = order.checkout(gateway)

    assert result.is_paid
```

### Mock

```python
from unittest.mock import Mock, patch

def test_send_notification():
    # 创建 Mock
    mock_email = Mock()
    mock_email.send.return_value = True

    notification_service = NotificationService(email_client=mock_email)
    notification_service.notify("user@example.com", "Hello")

    # 验证调用
    mock_email.send.assert_called_once_with(
        to="user@example.com",
        body="Hello"
    )

@patch('myapp.services.requests.get')
def test_api_call(mock_get):
    mock_get.return_value.json.return_value = {"data": "test"}

    result = fetch_data()

    assert result == {"data": "test"}
```

### Spy

```python
from unittest.mock import Mock

def test_with_spy():
    # Spy 会记录调用但保持原有行为
    real_service = RealService()
    spy = Mock(wraps=real_service)

    spy.process("data")

    # 验证调用
    spy.process.assert_called_with("data")
    # 同时真实逻辑也被执行了
```

### Fake

```python
class FakeDatabase:
    """内存数据库 Fake 实现"""

    def __init__(self):
        self._data = {}

    def save(self, table: str, record: dict):
        if table not in self._data:
            self._data[table] = []
        self._data[table].append(record)

    def find(self, table: str, query: dict) -> list:
        return [
            r for r in self._data.get(table, [])
            if all(r.get(k) == v for k, v in query.items())
        ]

def test_with_fake_db():
    db = FakeDatabase()
    repo = UserRepository(db)

    repo.create(User(name="Alice"))

    users = repo.find_by_name("Alice")
    assert len(users) == 1
```

## 断言模式

### Custom Assertions

```python
def assert_valid_email(email: str):
    """自定义邮箱验证断言"""
    import re
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    assert re.match(pattern, email), f"Invalid email: {email}"

def assert_response_ok(response):
    """自定义响应验证断言"""
    assert response.status_code == 200
    assert response.json().get("success") is True

def test_user_email():
    user = create_user()
    assert_valid_email(user.email)
```

### Soft Assertions

```python
from soft_asserts import SoftAssert

def test_user_properties():
    user = create_user()
    soft = SoftAssert()

    soft.assert_equals(user.name, "Alice", "name should be Alice")
    soft.assert_equals(user.age, 25, "age should be 25")
    soft.assert_true(user.is_active, "user should be active")

    soft.assert_all()  # 报告所有失败的断言
```

## 参数化测试

### Pytest Parametrize

```python
import pytest

@pytest.mark.parametrize("input,expected", [
    (1, 1),
    (2, 4),
    (3, 9),
    (4, 16),
])
def test_square(input, expected):
    assert square(input) == expected

@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (-1, 1, 0),
    (0, 0, 0),
])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

### 边界值测试

```python
@pytest.mark.parametrize("value,expected", [
    (0, "zero"),       # 边界: 最小值
    (1, "positive"),   # 边界: 最小正数
    (-1, "negative"),  # 边界: 最大负数
    (100, "positive"), # 正常值
    (999999, "positive"),  # 边界: 大数
])
def test_classify_number(value, expected):
    assert classify(value) == expected
```

## 测试隔离模式

### 测试夹具 (Fixtures)

```python
import pytest

@pytest.fixture
def db():
    """每个测试前创建，测试后销毁"""
    database = Database(":memory:")
    database.create_tables()
    yield database
    database.close()

@pytest.fixture(scope="module")
def shared_db():
    """模块内共享的数据库"""
    database = Database(":memory:")
    database.create_tables()
    yield database
    database.close()

def test_insert(db):
    db.insert("users", {"name": "Alice"})
    assert db.count("users") == 1
```

### 事务回滚

```python
@pytest.fixture
def db_session():
    """每个测试在事务中运行，测试后回滚"""
    session = Session()
    session.begin()
    yield session
    session.rollback()
    session.close()

def test_create_user(db_session):
    user = User(name="Test")
    db_session.add(user)
    db_session.flush()

    assert user.id is not None
    # 测试结束后自动回滚
```
