# DrinkCoffee (请喝咖啡 / 打赏支持) 模块

这是一个专为 PyQt6 桌面应用设计的独立打赏/请喝咖啡对话框组件。它支持启动次数自动计数、定期弹窗提醒、中英双语切换，并且支持通过本地图片路径或 Base64 编码数据来展示微信收款二维码。

---

## 🛠 目录结构

建议在调用此模块的应用中采用如下目录结构：
```text
drink-coffee/
├── coffee-support.py      # 打赏模块核心代码
├── qr_resource.py         # 收款码 Base64 资源文件（可选）
├── logo.ico               # 窗口图标 ICO 格式
├── logo.png               # 窗口图标 PNG 格式
└── README.md              # 本说明文档
```

---

## 🛠 依赖项

- **Python** $\ge$ 3.10
- **PyQt6**
- 收款码图片（支持 `.png`, `.jpg`, 或 Base64 字符串）

---

## 📦 接口说明 (`CoffeeSupport`)

### 1. 构造函数 `__init__`

```python
CoffeeSupport(
    appName="AstraView",
    usageFilePath=None,
    usageThreshold=50,
    paypalUrl="https://www.paypal.me/xuxinkuan",
    wechatQrBase64=None,
    wechatQrPath=None,
    language="中文"
)
```

**参数解释**：
- `appName` (str): 您的应用程序名称。用于在对话框标题及提示语中进行动态渲染。
- `usageFilePath` (str, 可选): 用于记录程序运行/启动次数的文本文件绝对路径。若传入 `None`，则默认存放在用户主目录下的 `~/.<appName>/usage_tracker.txt`。
- `usageThreshold` (int): 弹窗提醒的次数阈值。每当启动次数为该值的整倍数时（例如第 50 次、100 次等），将自动触发弹窗。
- `paypalUrl` (str, 可选): PayPal 赞助链接。如果不提供（设为 `None` 或空字符），则不显示 PayPal 按钮。
- `wechatQrBase64` (str, 可选): 微信收款码的 Base64 编码数据字符串。
- `wechatQrPath` (str, 可选): 微信收款码图片的本地文件绝对路径（如 `logo.png`）。优先从该路径加载，若不存在则降级读取 Base64 编码。
- `language` (str): 默认界面语言。可选值：`"中文"` 或 `"English"`。

---

### 2. 核心方法

#### `incrementUsage(self) -> int`
- **功能**：将配置文件中的启动次数累加 1。
- **返回值**：返回最新的启动次数。

#### `checkAndShow(self, parent=None) -> None`
- **功能**：自动读取已记录的启动次数。排除首次启动，当次数为 `usageThreshold` 的整倍数时，在主界面中居中弹出打赏对话框。
- **参数**：`parent` 为父窗口实例（如主窗口的 `self`），确保弹窗的层级及位置正确。

#### `showSupportDialog(self, parent=None) -> None`
- **功能**：无视当前启动次数，直接弹出打赏选择窗口（适合在“帮助”菜单中设置“赞助作者”按钮时调用）。

---

## 🚀 快速调用示例

由于模块文件名包含连字符 `coffee-support.py`（符合 `kebab-case` 规范），在 Python 中直接使用 `import` 关键字会产生语法错误。推荐使用以下两种方式之一进行调用：

### 方式 A：直接导入（推荐重命名）
如果您希望使用最标准的 Python 语法导入，**请将文件名重命名为 `coffee_support.py`（使用下划线）**，然后直接导入：

```python
from PyQt6.QtWidgets import QApplication, QMainWindow
from PyQt6.QtCore import QTimer
import sys

# 1. 导入重命名后的模块
from coffee_support import CoffeeSupport

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("我的 PyQt6 应用")
        self.resize(600, 400)

        # 2. 初始化打赏模块
        self.coffeeSupport = CoffeeSupport(
            appName="MyApp",
            usageThreshold=30,      # 每启动 30 次提示一次
            paypalUrl="https://www.paypal.me/yourname",
            wechatQrPath="path/to/your_wechat_qr.png",  # 传入本地二维码路径
            language="中文"
        )
        
        # 3. 增加并记录启动次数
        self.coffeeSupport.incrementUsage()

        # 4. 延时 1 秒，等待主界面显示后自动检测并弹窗提醒
        QTimer.singleShot(1000, lambda: self.coffeeSupport.checkAndShow(self))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
```

---

### 方式 B：使用 `importlib` 动态加载（保留连字符文件名）
如果您希望在项目中直接使用原始的 `coffee-support.py` 文件，可以通过 Python 的动态加载库 `importlib` 进行导入：

```python
import importlib
from PyQt6.QtWidgets import QMainWindow
from PyQt6.QtCore import QTimer

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        # 1. 动态加载连字符文件名模块
        coffee_support_module = importlib.import_module("coffee-support")
        
        # 2. 实例化并配置
        self.coffeeSupport = coffee_support_module.CoffeeSupport(
            appName="AstraView",
            usageThreshold=50,
            wechatQrBase64="[Base64_Data_Here]"
        )
        
        # 3. 累加次数并自动检测弹窗
        self.coffeeSupport.incrementUsage()
        QTimer.singleShot(1000, lambda: self.coffeeSupport.checkAndShow(self))
```
