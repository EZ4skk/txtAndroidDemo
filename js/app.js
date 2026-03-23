/**
 * 主应用逻辑
 */

const App = {
    state: {
        currentFileHandle: null,
        currentFileName: '未命名.txt',
        currentContent: '',
        isModified: false,
        isWelcomeScreen: true
    },

    elements: {},

    init: function() {
        this.cacheElements();
        this.bindEvents();
        this.registerServiceWorker();
    },

    cacheElements: function() {
        this.elements = {
            backBtn: document.getElementById('backBtn'),
            filename: document.getElementById('filename'),
            saveBtn: document.getElementById('saveBtn'),
            unsavedIndicator: document.getElementById('unsavedIndicator'),
            welcomeScreen: document.getElementById('welcomeScreen'),
            editorContainer: document.getElementById('editorContainer'),
            editor: document.getElementById('editor'),
            bottomMenu: document.getElementById('bottomMenu'),
            newFileBtn: document.getElementById('newFileBtn'),
            openFileBtn: document.getElementById('openFileBtn'),
            bottomNewBtn: document.getElementById('bottomNewBtn'),
            bottomOpenBtn: document.getElementById('bottomOpenBtn'),
            bottomSaveBtn: document.getElementById('bottomSaveBtn'),
            bottomSaveAsBtn: document.getElementById('bottomSaveAsBtn')
        };
    },

    bindEvents: function() {
        // 欢迎界面按钮
        this.elements.newFileBtn.addEventListener('click', () => this.newFile());
        this.elements.openFileBtn.addEventListener('click', () => this.openFile());

        // 工具栏按钮
        this.elements.backBtn.addEventListener('click', () => this.showWelcomeScreen());
        this.elements.saveBtn.addEventListener('click', () => this.saveFile());

        // 底部菜单按钮
        this.elements.bottomNewBtn.addEventListener('click', () => this.newFile());
        this.elements.bottomOpenBtn.addEventListener('click', () => this.openFile());
        this.elements.bottomSaveBtn.addEventListener('click', () => this.saveFile());
        this.elements.bottomSaveAsBtn.addEventListener('click', () => this.saveFileAs());

        // 编辑器事件
        this.elements.editor.addEventListener('input', () => this.onEditorInput());

        // 阻止离开页面时丢失未保存内容
        window.addEventListener('beforeunload', (e) => this.onBeforeUnload(e));
    },

    registerServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration.scope);
                })
                .catch((err) => {
                    console.log('Service Worker registration failed:', err);
                });
        }
    },

    newFile: function() {
        if (this.state.isModified) {
            if (!confirm('当前文档有未保存的更改，确定要新建吗？')) {
                return;
            }
        }

        this.state.currentFileHandle = null;
        this.state.currentFileName = '未命名.txt';
        this.state.currentContent = '';
        this.state.isModified = false;

        this.elements.editor.value = '';
        this.showEditor();
        this.updateUI();
    },

    async openFile() {
        const result = await FileAPI.openFile();

        if (result.success) {
            if (this.state.isModified) {
                if (!confirm('当前文档有未保存的更改，确定要打开新文件吗？')) {
                    return;
                }
            }

            this.state.currentFileHandle = result.handle || null;
            this.state.currentFileName = result.name;
            this.state.currentContent = result.content;
            this.state.isModified = false;

            this.elements.editor.value = result.content;
            this.showEditor();
            this.updateUI();
        } else if (result.error) {
            alert('打开文件失败: ' + (result.error.message || '未知错误'));
        }
    },

    async saveFile() {
        const content = this.elements.editor.value;
        const result = await FileAPI.saveFile(
            this.state.currentFileHandle,
            content,
            this.state.currentFileName
        );

        if (result.success) {
            if (result.isDownload) {
                alert('文件已下载');
            } else {
                this.state.currentContent = content;
                this.state.isModified = false;
                this.updateUI();
            }
        } else if (result.error) {
            alert('保存文件失败: ' + (result.error.message || '未知错误'));
        }
    },

    async saveFileAs() {
        const content = this.elements.editor.value;
        const result = await FileAPI.saveFileAs(content, this.state.currentFileName);

        if (result.success) {
            if (result.isDownload) {
                alert('文件已下载');
            } else {
                this.state.currentFileHandle = result.handle;
                this.state.currentFileName = result.name;
                this.state.currentContent = content;
                this.state.isModified = false;
                this.updateUI();
            }
        } else if (result.error && !result.cancelled) {
            alert('另存为失败: ' + (result.error.message || '未知错误'));
        }
    },

    showWelcomeScreen: function() {
        if (this.state.isModified) {
            if (!confirm('当前文档有未保存的更改，确定要返回吗？')) {
                return;
            }
        }

        this.state.isWelcomeScreen = true;
        this.elements.welcomeScreen.classList.remove('hidden');
        this.elements.editorContainer.classList.add('hidden');
        this.elements.bottomMenu.classList.add('hidden');
        this.elements.backBtn.classList.add('hidden');
    },

    showEditor: function() {
        this.state.isWelcomeScreen = false;
        this.elements.welcomeScreen.classList.add('hidden');
        this.elements.editorContainer.classList.remove('hidden');
        this.elements.bottomMenu.classList.remove('hidden');
        this.elements.backBtn.classList.remove('hidden');
        this.elements.editor.focus();
    },

    onEditorInput: function() {
        const content = this.elements.editor.value;
        this.state.isModified = content !== this.state.currentContent;
        this.updateUI();
    },

    updateUI: function() {
        this.elements.filename.textContent = this.state.currentFileName;

        if (this.state.isModified) {
            this.elements.unsavedIndicator.classList.remove('hidden');
        } else {
            this.elements.unsavedIndicator.classList.add('hidden');
        }
    },

    onBeforeUnload: function(e) {
        if (this.state.isModified) {
            e.preventDefault();
            e.returnValue = '您有未保存的更改，确定要离开吗？';
            return e.returnValue;
        }
    }
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
