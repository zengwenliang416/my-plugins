# 设计模式目录

## 创建型模式

### Factory Method (工厂方法)

**意图**: 定义创建对象的接口，让子类决定实例化哪个类

```python
from abc import ABC, abstractmethod

class Document(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

class PDFDocument(Document):
    def render(self) -> str:
        return "Rendering PDF"

class HTMLDocument(Document):
    def render(self) -> str:
        return "Rendering HTML"

class DocumentFactory(ABC):
    @abstractmethod
    def create_document(self) -> Document:
        pass

class PDFFactory(DocumentFactory):
    def create_document(self) -> Document:
        return PDFDocument()

class HTMLFactory(DocumentFactory):
    def create_document(self) -> Document:
        return HTMLDocument()

# 使用
factory = PDFFactory()
doc = factory.create_document()
print(doc.render())  # Rendering PDF
```

**适用场景**:

- 不知道具体需要创建哪种对象
- 需要将对象创建逻辑委托给子类
- 需要通过公共接口创建对象

### Abstract Factory (抽象工厂)

**意图**: 提供创建一系列相关对象的接口

```python
class Button(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

class Input(ABC):
    @abstractmethod
    def render(self) -> str:
        pass

# Windows 风格
class WindowsButton(Button):
    def render(self) -> str:
        return "<button class='windows'>Click</button>"

class WindowsInput(Input):
    def render(self) -> str:
        return "<input class='windows'/>"

# Mac 风格
class MacButton(Button):
    def render(self) -> str:
        return "<button class='mac'>Click</button>"

class MacInput(Input):
    def render(self) -> str:
        return "<input class='mac'/>"

class UIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button:
        pass

    @abstractmethod
    def create_input(self) -> Input:
        pass

class WindowsFactory(UIFactory):
    def create_button(self) -> Button:
        return WindowsButton()

    def create_input(self) -> Input:
        return WindowsInput()

class MacFactory(UIFactory):
    def create_button(self) -> Button:
        return MacButton()

    def create_input(self) -> Input:
        return MacInput()
```

### Builder (建造者)

**意图**: 分步骤构建复杂对象

```python
from dataclasses import dataclass, field

@dataclass
class EmailMessage:
    sender: str = ""
    recipients: list[str] = field(default_factory=list)
    subject: str = ""
    body: str = ""
    attachments: list[str] = field(default_factory=list)

class EmailBuilder:
    def __init__(self):
        self._email = EmailMessage()

    def from_address(self, sender: str) -> "EmailBuilder":
        self._email.sender = sender
        return self

    def to(self, *recipients: str) -> "EmailBuilder":
        self._email.recipients.extend(recipients)
        return self

    def subject(self, subject: str) -> "EmailBuilder":
        self._email.subject = subject
        return self

    def body(self, body: str) -> "EmailBuilder":
        self._email.body = body
        return self

    def attach(self, *files: str) -> "EmailBuilder":
        self._email.attachments.extend(files)
        return self

    def build(self) -> EmailMessage:
        return self._email

# 使用
email = (
    EmailBuilder()
    .from_address("sender@example.com")
    .to("user1@example.com", "user2@example.com")
    .subject("Hello")
    .body("This is the body")
    .attach("file.pdf")
    .build()
)
```

### Singleton (单例)

**意图**: 确保类只有一个实例

```python
class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Python 更优雅的方式：模块级单例
# config.py
class _Config:
    def __init__(self):
        self.settings = {}

config = _Config()  # 模块导入时创建唯一实例

# 使用
from config import config
```

## 结构型模式

### Adapter (适配器)

**意图**: 将一个接口转换成另一个接口

```python
# 旧接口
class LegacyPayment:
    def make_payment(self, amount: float) -> dict:
        return {"status": "success", "amount": amount}

# 新接口
class PaymentProcessor(ABC):
    @abstractmethod
    def process(self, amount: float, currency: str) -> bool:
        pass

# 适配器
class LegacyPaymentAdapter(PaymentProcessor):
    def __init__(self, legacy: LegacyPayment):
        self._legacy = legacy

    def process(self, amount: float, currency: str) -> bool:
        result = self._legacy.make_payment(amount)
        return result["status"] == "success"

# 使用
legacy = LegacyPayment()
adapter = LegacyPaymentAdapter(legacy)
adapter.process(100.0, "USD")
```

### Decorator (装饰器)

**意图**: 动态地给对象添加额外职责

```python
class DataSource(ABC):
    @abstractmethod
    def write(self, data: str) -> None:
        pass

    @abstractmethod
    def read(self) -> str:
        pass

class FileDataSource(DataSource):
    def __init__(self, filename: str):
        self.filename = filename

    def write(self, data: str) -> None:
        with open(self.filename, "w") as f:
            f.write(data)

    def read(self) -> str:
        with open(self.filename, "r") as f:
            return f.read()

class DataSourceDecorator(DataSource):
    def __init__(self, source: DataSource):
        self._wrapped = source

    def write(self, data: str) -> None:
        self._wrapped.write(data)

    def read(self) -> str:
        return self._wrapped.read()

class EncryptionDecorator(DataSourceDecorator):
    def write(self, data: str) -> None:
        encrypted = self._encrypt(data)
        super().write(encrypted)

    def read(self) -> str:
        data = super().read()
        return self._decrypt(data)

    def _encrypt(self, data: str) -> str:
        return f"ENCRYPTED({data})"

    def _decrypt(self, data: str) -> str:
        return data[10:-1]  # 简化示例

# 使用
source = EncryptionDecorator(FileDataSource("data.txt"))
source.write("secret data")
```

### Facade (外观)

**意图**: 为子系统提供统一的高层接口

```python
class VideoConverter:
    def convert(self, filename: str, format: str) -> str:
        return f"converted_{filename}.{format}"

class AudioExtractor:
    def extract(self, video: str) -> str:
        return f"audio_from_{video}"

class Compressor:
    def compress(self, file: str) -> str:
        return f"compressed_{file}"

# 外观
class MediaConverterFacade:
    def __init__(self):
        self._video_converter = VideoConverter()
        self._audio_extractor = AudioExtractor()
        self._compressor = Compressor()

    def convert_video(self, filename: str, format: str) -> str:
        video = self._video_converter.convert(filename, format)
        compressed = self._compressor.compress(video)
        return compressed

    def extract_audio(self, filename: str) -> str:
        audio = self._audio_extractor.extract(filename)
        return self._compressor.compress(audio)

# 使用
facade = MediaConverterFacade()
result = facade.convert_video("movie.avi", "mp4")
```

## 行为型模式

### Strategy (策略)

**意图**: 定义一系列算法，使它们可以互换

```python
class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: list) -> list:
        pass

class QuickSort(SortStrategy):
    def sort(self, data: list) -> list:
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        middle = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + middle + self.sort(right)

class MergeSort(SortStrategy):
    def sort(self, data: list) -> list:
        # 归并排序实现
        ...

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: SortStrategy):
        self._strategy = strategy

    def sort(self, data: list) -> list:
        return self._strategy.sort(data)

# 使用
sorter = Sorter(QuickSort())
result = sorter.sort([3, 1, 4, 1, 5, 9, 2, 6])
```

### Observer (观察者)

**意图**: 定义对象间的一对多依赖，当一个对象改变时通知所有依赖者

```python
class Subject:
    def __init__(self):
        self._observers: list[Observer] = []

    def attach(self, observer: "Observer"):
        self._observers.append(observer)

    def detach(self, observer: "Observer"):
        self._observers.remove(observer)

    def notify(self, event: str):
        for observer in self._observers:
            observer.update(event)

class Observer(ABC):
    @abstractmethod
    def update(self, event: str):
        pass

class EmailNotifier(Observer):
    def update(self, event: str):
        print(f"Sending email about: {event}")

class LogNotifier(Observer):
    def update(self, event: str):
        print(f"Logging event: {event}")

# 使用
subject = Subject()
subject.attach(EmailNotifier())
subject.attach(LogNotifier())
subject.notify("User registered")
```

### Command (命令)

**意图**: 将请求封装成对象

```python
class Command(ABC):
    @abstractmethod
    def execute(self):
        pass

    @abstractmethod
    def undo(self):
        pass

class Editor:
    def __init__(self):
        self.text = ""

    def insert(self, text: str):
        self.text += text

    def delete(self, length: int):
        self.text = self.text[:-length]

class InsertCommand(Command):
    def __init__(self, editor: Editor, text: str):
        self.editor = editor
        self.text = text

    def execute(self):
        self.editor.insert(self.text)

    def undo(self):
        self.editor.delete(len(self.text))

class CommandHistory:
    def __init__(self):
        self._history: list[Command] = []

    def push(self, command: Command):
        self._history.append(command)

    def pop(self) -> Command | None:
        return self._history.pop() if self._history else None

# 使用
editor = Editor()
history = CommandHistory()

cmd = InsertCommand(editor, "Hello")
cmd.execute()
history.push(cmd)

# 撤销
last_cmd = history.pop()
if last_cmd:
    last_cmd.undo()
```
