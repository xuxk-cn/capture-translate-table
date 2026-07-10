import os
import sys
import base64
from PyQt6.QtWidgets import (
    QMessageBox, QDialog, QVBoxLayout, QLabel, QPushButton
)
from PyQt6.QtGui import QPixmap, QDesktopServices
from PyQt6.QtCore import Qt, QUrl

# 全局语言配置常量
TRANSLATIONS = {
    "中文": {
        "supportTitle": "支持 {appName}",
        "supportMsg": "您已经使用了 {appName} 多次，是否愿意支持一下作者的开发工作？",
        "supportNo": "残忍拒绝",
        "wechatTitle": "💚 微信打赏",
        "wechatTip": "感谢支持！请使用微信扫描下方收款码 🙏",
        "wechatErr": "⚠️ 收款码图片加载失败",
        "close": "关闭"
    },
    "English": {
        "supportTitle": "Support {appName}",
        "supportMsg": "You have used {appName} several times. Would you like to support the developer?",
        "supportNo": "No, thanks",
        "wechatTitle": "💚 WeChat Pay",
        "wechatTip": "Thank you for your support! Please scan the QR code below 🙏",
        "wechatErr": "⚠️ Failed to load QR code image",
        "close": "Close"
    }
}

class CoffeeSupport:
    """
    请喝咖啡 / 打赏支持的独立封装模块。
    """
    def __init__(self, appName="AstraView", usageFilePath=None, usageThreshold=50, paypalUrl="https://www.paypal.me/xuxinkuan", wechatQrBase64=None, wechatQrPath=None, language="中文"):
        self.appName = appName
        self.usageThreshold = usageThreshold
        self.paypalUrl = paypalUrl
        self.wechatQrBase64 = wechatQrBase64
        self.wechatQrPath = wechatQrPath
        self.language = language if language in TRANSLATIONS else "中文"
        
        # 默认将使用次数配置文件存放在用户主目录下的 .<appName> 目录中
        if usageFilePath is None:
            configDir = os.path.join(os.path.expanduser("~"), f".{self.appName}")
            os.makedirs(configDir, exist_ok=True)
            self.usageFilePath = os.path.join(configDir, "usage_tracker.txt")
        else:
            self.usageFilePath = usageFilePath

    def loadUsage(self) -> int:
        """
        读取当前已记录的启动次数。
        """
        count = 0
        if os.path.exists(self.usageFilePath):
            try:
                with open(self.usageFilePath, "r", encoding="utf-8") as f:
                    count = int(f.read().strip())
            except Exception:
                pass
        return count

    def saveUsage(self, count: int) -> None:
        """
        将当前启动次数保存至文件。
        """
        try:
            with open(self.usageFilePath, "w", encoding="utf-8") as f:
                f.write(str(count))
        except Exception:
            pass

    def incrementUsage(self) -> int:
        """
        递增使用次数并保存，返回最新使用次数。
        """
        count = self.loadUsage()
        count += 1
        self.saveUsage(count)
        return count

    def checkAndShow(self, parent=None) -> None:
        """
        自动检查使用次数，排除首次运行，且当次数为 threshold 的整倍数时弹出打赏。
        """
        count = self.loadUsage()
        if count > 1 and count % self.usageThreshold == 0:
            self.showSupportDialog(parent)

    def showSupportDialog(self, parent=None) -> None:
        """
        弹出打赏询问主对话框。
        """
        tr = TRANSLATIONS[self.language]
        title = tr["supportTitle"].format(appName=self.appName)
        msg = tr["supportMsg"].format(appName=self.appName)
        noText = tr["supportNo"]

        box = QMessageBox(parent)
        box.setWindowTitle(title)
        box.setText(msg)
        box.setIcon(QMessageBox.Icon.Information)
        
        paypalBtn = None
        wechatBtn = None
        
        if self.paypalUrl:
            paypalBtn = box.addButton("💳 PayPal", QMessageBox.ButtonRole.AcceptRole)
        
        if self.wechatQrBase64 or self.wechatQrPath:
            wechatBtn = box.addButton("💚 微信", QMessageBox.ButtonRole.AcceptRole)
            
        box.addButton(noText, QMessageBox.ButtonRole.RejectRole)
        
        box.exec()
        
        if paypalBtn and box.clickedButton() == paypalBtn:
            QDesktopServices.openUrl(QUrl(self.paypalUrl))
        elif wechatBtn and box.clickedButton() == wechatBtn:
            self._showWechatQrPopup(parent)

    def _showWechatQrPopup(self, parent=None) -> None:
        """
        弹出微信收款二维码子界面。
        """
        tr = TRANSLATIONS[self.language]
        dialog = QDialog(parent)
        dialog.setWindowTitle(tr["wechatTitle"])
        dialog.setMinimumWidth(320)

        dlgLayout = QVBoxLayout(dialog)
        dlgLayout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        tipLabel = QLabel(tr["wechatTip"])
        tipLabel.setAlignment(Qt.AlignmentFlag.AlignCenter)
        tipLabel.setStyleSheet("font-size: 14px; margin-bottom: 10px;")
        dlgLayout.addWidget(tipLabel)

        qrLabel = QLabel()
        qrLabel.setAlignment(Qt.AlignmentFlag.AlignCenter)

        pixmap = QPixmap()
        loaded = False
        
        # 优先读取物理文件路径，其次读取 Base64 编码数据
        if self.wechatQrPath and os.path.exists(self.wechatQrPath):
            loaded = pixmap.load(self.wechatQrPath)
        elif self.wechatQrBase64:
            try:
                decodedData = base64.b64decode(self.wechatQrBase64)
                loaded = pixmap.loadFromData(decodedData)
            except Exception:
                pass
                
        if loaded and not pixmap.isNull():
            scaled = pixmap.scaled(
                300, 300,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            qrLabel.setPixmap(scaled)
        else:
            qrLabel.setText(tr["wechatErr"])
            qrLabel.setStyleSheet("color: #ff6666; font-size: 14px;")

        dlgLayout.addWidget(qrLabel)

        closeBtn = QPushButton(tr["close"])
        closeBtn.setCursor(Qt.CursorShape.PointingHandCursor)
        closeBtn.clicked.connect(dialog.accept)
        dlgLayout.addWidget(closeBtn, alignment=Qt.AlignmentFlag.AlignCenter)

        dialog.exec()
