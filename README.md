# Capture Translate Table

浏览器扩展，支持**截图翻译**和**AI 表格识别**（核心亮点功能）。

语言 / Languages: [中文](#中文) | [English](#english) | [Deutsch](#deutsch) | [Francais](#francais) | [Espanol](#espanol)

## 中文

### 项目简介

`Capture Translate Table` 是一个基于 Chromium 内核浏览器的扩展，提供两项核心能力：

1. **截图区域识别并翻译**
2. **🚀 AI 表格识别与 Excel 导出**（核心亮点功能）

插件通过页面覆盖层让用户拖拽选择网页中的任意区域，然后将截图发送给本地 AI 模型服务进行 OCR、翻译或表格识别。识别结果会在页面内弹窗中展示，表格结果会直接下载为 `.xlsx` 文件。

### 核心亮点：AI 表格识别

**表格识别**是本插件最核心、最有技术含量的功能：

- 📊 **视觉表格抽取**：利用 Qwen2-VL 等视觉大模型，从截图中直接识别表格结构
- 🔄 **保持原始格式**：精准保留原表格的行、列、单元格关系
- 📄 **标准 Excel 导出**：直接生成 `.xlsx` 格式文件，支持在 Excel/WPS 中直接编辑
- 🎯 **智能容错**：即使是图片表格、扫描件表格、复杂布局表格也能准确识别
- 💾 **无需后端**：纯浏览器端 + 本地模型服务，数据安全有保障

### 主要功能

- 截图框选网页任意区域
- OCR 识别截图中的文字
- 将识别出的文字翻译后在页面中直接显示
- 🚀 **核心**：识别图片中的表格并导出为标准 Excel 文件
- 支持结果复制
- 支持在插件弹窗中显示打赏二维码

### 当前实现说明

- 浏览器扩展类型：Manifest V3
- 当前依赖本地 OpenAI 兼容接口：
  - `http://localhost:8081/v1/chat/completions`
- 默认模型名写在代码中：
  - `qwen2-vl`
- 支持的浏览器：
  - Chrome
  - Edge
  - 其他 Chromium 内核浏览器

### 安装方式

#### 1. 准备本地模型服务

你需要先启动一个兼容 OpenAI Chat Completions 协议的本地视觉模型服务，并确保下面这个接口可访问：

```text
http://localhost:8081/v1/chat/completions
```

如果你的模型地址或模型名不同，需要自行修改 [`content.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21) 中的配置。

#### 2. 本地加载扩展

以 Chrome / Edge 为例：

1. 打开扩展管理页面
2. 开启“开发者模式”
3. 选择“加载已解压的扩展程序”
4. 选择当前项目根目录

### 使用方法

#### 截图翻译

1. 点击扩展图标
2. 点击 `截图并翻译`
3. 在网页上拖拽选择区域
4. 等待 OCR 和翻译完成
5. 在页面弹窗中查看并复制结果

#### 表格转 Excel

1. 点击扩展图标
2. 点击 `截取表格转Excel`
3. 在网页上拖拽选择表格区域
4. 等待 AI 提取表格
5. 浏览器自动下载 `.xlsx` 文件

### 权限说明

扩展当前声明了以下权限：

- `activeTab`
- `tabs`
- `scripting`
- `host_permissions: <all_urls>`

这些权限用于：

- 获取当前标签页
- 注入截图交互脚本
- 对当前可见网页进行截图
- 在网页中展示选择框、加载状态和结果弹窗

### 项目结构

```text
.
├── background.js         # 调用浏览器截图 API
├── content.js            # 页面覆盖层、截图裁剪、OCR/翻译/表格提取流程
├── manifest.json         # 扩展清单
├── popup.html            # 插件弹窗 UI
├── popup.js              # 弹窗按钮交互
├── xlsx.full.min.js      # SheetJS 库，用于导出 Excel
└── drink-coffee/         # 打赏资源与说明
```

### 已知限制

- 当前不能在 `chrome://`、扩展页、Web Store 等浏览器内部页面使用
- 强依赖本地 AI 服务，服务未启动时会报错
- 当前没有全局快捷键入口
- 当前不是“选词翻译”模式，而是“截图区域翻译”模式

### 开发说明

如果你想修改模型配置，优先看这里：

- [`content.js:L20-L21`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21)

如果你想修改插件弹窗：

- [`popup.html`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/popup.html)
- [`popup.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/popup.js)

### 打赏支持

插件弹窗中已经集成打赏入口，支持：

- 微信
- 支付宝

相关资源位于 [`drink-coffee`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/drink-coffee) 目录。

### 适用场景

- 阅读外语网页时快速截图翻译
- 提取网页中的图片表格、扫描表格或复杂表格
- 从不可复制的页面内容中提取文本

### 后续可改进方向

- 增加快捷键启动截图
- 增加多语言 UI
- 增加配置页，让用户自定义模型地址和模型名称
- 增加历史记录与导出选项
- 增加更稳定的表格结构修正逻辑

## English

### Overview

`Capture Translate Table` is a Chromium-based browser extension for two main tasks:

1. screenshot-based OCR and translation
2. **🚀 AI-powered table recognition & Excel export** (core highlight feature)

The extension lets the user drag a rectangle over any visible area of a webpage, captures the selected area, sends it to a local AI vision model service, and then either shows translated text in an on-page dialog or exports the detected table as an `.xlsx` file.

### Core Highlight: AI Table Recognition

**Table recognition** is the most core and technically advanced feature of this extension:

- 📊 **Visual table extraction**: Using vision models like Qwen2-VL to directly recognize table structures from screenshots
- 🔄 **Preserve original format**: Accurately maintains row, column, and cell relationships from the original table
- 📄 **Standard Excel export**: Directly generates `.xlsx` files that can be edited in Excel/WPS
- 🎯 **Smart fault tolerance**: Accurately recognizes even image tables, scanned tables, and complex layout tables
- 💾 **No backend required**: Pure browser + local model service, ensuring data security

### Features

- Select any visible area on a webpage
- OCR text from screenshots
- Translate extracted text directly inside the page
- 🚀 **Core**: Extract tables from screenshots and export to Excel
- Copy results from the result dialog
- Built-in donation panel in the popup

### Requirements

- Chrome, Edge, or another Chromium-based browser
- A local OpenAI-compatible vision model service
- Default API endpoint:

```text
http://localhost:8081/v1/chat/completions
```

- Default model name in code: `qwen2-vl`

If your endpoint or model name is different, update [`content.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21).

### Installation

1. Start your local AI model service
2. Open the extensions page in your browser
3. Enable developer mode
4. Load this project folder as an unpacked extension

### Usage

#### Screenshot Translation

1. Open the extension popup
2. Click `截图并翻译`
3. Drag to select an area on the page
4. Wait for OCR and translation
5. Read or copy the result from the popup dialog

#### Table to Excel

1. Open the extension popup
2. Click `截取表格转Excel`
3. Drag to select a table region
4. Wait for AI table extraction
5. The browser downloads an `.xlsx` file automatically

### Permissions

The extension currently uses:

- `activeTab`
- `tabs`
- `scripting`
- `host_permissions: <all_urls>`

These permissions are required to capture the current tab, inject the overlay UI, and show on-page dialogs.

### Project Structure

```text
background.js    captureVisibleTab bridge
content.js       overlay UI, crop, OCR, translation, table extraction
manifest.json    extension manifest
popup.html       popup UI
popup.js         popup actions
xlsx.full.min.js Excel export library
drink-coffee/    donation assets
```

### Known Limitations

- Does not work on restricted browser pages such as `chrome://`
- Requires the local AI service to be running
- No global keyboard shortcut yet
- This is screenshot translation, not text-selection translation

### Support

The popup includes donation support via WeChat and Alipay. Related assets are stored in the `drink-coffee/` directory.

## Deutsch

### Ubersicht

`Capture Translate Table` ist eine Browser-Erweiterung fuer Chromium-basierte Browser. Sie bietet zwei Hauptfunktionen:

1. OCR und Uebersetzung auf Basis eines Screenshots
2. Tabellenerkennung aus einem Screenshot mit Export nach Excel

Der Benutzer waehlt einen Bereich auf der Webseite per Ziehen aus. Die Erweiterung erstellt einen Screenshot dieses Bereichs und sendet ihn an einen lokalen KI-Dienst. Danach wird entweder der uebersetzte Text in einem Dialog angezeigt oder eine `.xlsx`-Datei heruntergeladen.

### Funktionen

- Auswahl eines beliebigen sichtbaren Bereichs einer Webseite
- OCR aus Screenshots
- Anzeige der Uebersetzung direkt auf der Seite
- Extraktion von Tabellen und Export nach Excel
- Kopieren des Ergebnisses
- Spendenbereich im Popup

### Voraussetzungen

- Chrome, Edge oder ein anderer Chromium-Browser
- Ein lokaler OpenAI-kompatibler Vision-Dienst
- Standard-Endpunkt:

```text
http://localhost:8081/v1/chat/completions
```

- Standardmodell im Code: `qwen2-vl`

Bei abweichender Konfiguration bitte [`content.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21) anpassen.

### Installation

1. Lokalen KI-Dienst starten
2. Erweiterungsseite im Browser oeffnen
3. Entwicklermodus aktivieren
4. Dieses Projekt als entpackte Erweiterung laden

### Verwendung

- `截图并翻译`: Screenshot aufnehmen, Text erkennen und uebersetzen
- `截取表格转Excel`: Tabellenbereich erfassen und als Excel exportieren

### Berechtigungen

- `activeTab`
- `tabs`
- `scripting`
- `host_permissions: <all_urls>`

Diese Berechtigungen werden fuer Screenshot, Script-Injektion und Anzeige der Oberflaeche auf der Seite benoetigt.

### Bekannte Einschraenkungen

- Funktioniert nicht auf internen Browser-Seiten wie `chrome://`
- Der lokale KI-Dienst muss laufen
- Noch keine globale Tastenkombination
- Aktuell nur Screenshot-Uebersetzung, keine Wortauswahl-Uebersetzung

## Francais

### Presentation

`Capture Translate Table` est une extension de navigateur pour les navigateurs bases sur Chromium. Elle propose deux fonctions principales :

1. OCR et traduction a partir d'une capture d'ecran
2. Extraction de tableaux depuis une capture avec export Excel

L'utilisateur selectionne une zone visible de la page. L'extension capture cette zone, l'envoie a un service local d'IA compatible OpenAI, puis affiche le texte traduit dans une fenetre integree ou telecharge un fichier `.xlsx`.

### Fonctionnalites

- Selection d'une zone quelconque sur une page web
- OCR depuis une capture d'ecran
- Traduction affichee directement dans la page
- Extraction de tableaux et export vers Excel
- Copie du resultat
- Zone de soutien dans la fenetre popup

### Prerequis

- Chrome, Edge ou un autre navigateur base sur Chromium
- Un service local de modele visuel compatible OpenAI
- Point d'acces par defaut :

```text
http://localhost:8081/v1/chat/completions
```

- Nom du modele par defaut : `qwen2-vl`

Si besoin, modifiez [`content.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21).

### Installation

1. Demarrer le service local d'IA
2. Ouvrir la page des extensions du navigateur
3. Activer le mode developpeur
4. Charger ce dossier comme extension non empaquetee

### Utilisation

- `截图并翻译` : capture, OCR et traduction
- `截取表格转Excel` : extraction de tableau et export `.xlsx`

### Permissions

- `activeTab`
- `tabs`
- `scripting`
- `host_permissions: <all_urls>`

Ces permissions servent a capturer l'onglet courant, injecter l'interface et afficher les fenetres dans la page.

### Limitations connues

- Ne fonctionne pas sur les pages internes du navigateur comme `chrome://`
- Le service local d'IA doit etre actif
- Aucun raccourci clavier global pour le moment
- Il s'agit d'une traduction par capture, pas d'une traduction par selection de texte

## Espanol

### Descripcion general

`Capture Translate Table` es una extension para navegadores basados en Chromium. Ofrece dos funciones principales:

1. OCR y traduccion a partir de una captura de pantalla
2. Extraccion de tablas desde una captura con exportacion a Excel

El usuario arrastra para seleccionar una zona visible de la pagina. La extension captura esa region, la envia a un servicio local de IA compatible con OpenAI y luego muestra el texto traducido en un cuadro dentro de la pagina o descarga un archivo `.xlsx`.

### Funciones

- Seleccion de cualquier area visible de una pagina web
- OCR sobre capturas de pantalla
- Traduccion mostrada directamente en la pagina
- Extraccion de tablas y exportacion a Excel
- Copia del resultado
- Panel de apoyo en la ventana emergente

### Requisitos

- Chrome, Edge u otro navegador basado en Chromium
- Un servicio local de vision compatible con OpenAI
- Endpoint predeterminado:

```text
http://localhost:8081/v1/chat/completions
```

- Modelo predeterminado en el codigo: `qwen2-vl`

Si necesitas cambiarlo, edita [`content.js`](file:///e:/projects/%E8%BD%AF%E4%BB%B6%E5%BC%80%E5%8F%91/browser-extension+%E8%A1%A8%E6%A0%BC%E8%AF%86%E5%88%AB/content.js#L20-L21).

### Instalacion

1. Inicia tu servicio local de IA
2. Abre la pagina de extensiones del navegador
3. Activa el modo desarrollador
4. Carga esta carpeta como extension descomprimida

### Uso

- `截图并翻译`: captura, OCR y traduccion
- `截取表格转Excel`: extraccion de tablas y exportacion a `.xlsx`

### Permisos

- `activeTab`
- `tabs`
- `scripting`
- `host_permissions: <all_urls>`

Estos permisos se usan para capturar la pestana actual, inyectar la interfaz y mostrar los cuadros de resultado sobre la pagina.

### Limitaciones conocidas

- No funciona en paginas internas del navegador como `chrome://`
- Requiere que el servicio local de IA este en ejecucion
- Aun no hay atajo global de teclado
- Actualmente es traduccion por captura, no traduccion por seleccion de texto

