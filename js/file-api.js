/**
 * 文件操作模块
 * 提供现代File System Access API和兼容性后备方案
 */

const FileAPI = {
    /**
     * 检查是否支持现代File System Access API
     */
    supportsFileSystemAccess: function() {
        return 'showOpenFilePicker' in window &&
               'showSaveFilePicker' in window;
    },

    /**
     * 打开文件
     * @returns {Promise<Object>} 文件内容和信息
     */
    openFile: async function() {
        if (this.supportsFileSystemAccess()) {
            return await this._openFileModern();
        } else {
            return await this._openFileLegacy();
        }
    },

    /**
     * 现代方式打开文件（File System Access API）
     */
    _openFileModern: async function() {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }],
                multiple: false
            });

            const file = await fileHandle.getFile();
            const content = await file.text();

            return {
                success: true,
                handle: fileHandle,
                name: file.name,
                content: content,
                isModern: true
            };
        } catch (err) {
            if (err.name === 'AbortError') {
                return { success: false, cancelled: true };
            }
            console.error('打开文件失败:', err);
            return { success: false, error: err };
        }
    },

    /**
     * 兼容性方式打开文件（input[type=file]）
     */
    _openFileLegacy: function() {
        return new Promise((resolve) => {
            const input = document.getElementById('fileInput');
            input.value = '';

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve({ success: false, cancelled: true });
                    return;
                }

                try {
                    const content = await file.text();
                    resolve({
                        success: true,
                        file: file,
                        name: file.name,
                        content: content,
                        isModern: false
                    });
                } catch (err) {
                    console.error('读取文件失败:', err);
                    resolve({ success: false, error: err });
                }
            };

            input.click();
        });
    },

    /**
     * 保存文件
     * @param {Object} fileHandle 文件句柄（现代方式）
     * @param {string} content 文件内容
     * @param {string} filename 文件名（兼容性方式）
     * @returns {Promise<Object>} 保存结果
     */
    saveFile: async function(fileHandle, content, filename) {
        if (fileHandle && this.supportsFileSystemAccess()) {
            return await this._saveFileModern(fileHandle, content);
        } else {
            return this._saveFileLegacy(content, filename || '未命名.txt');
        }
    },

    /**
     * 现代方式保存文件
     */
    _saveFileModern: async function(fileHandle, content) {
        try {
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return { success: true };
        } catch (err) {
            console.error('保存文件失败:', err);
            return { success: false, error: err };
        }
    },

    /**
     * 兼容性方式保存文件（下载）
     */
    _saveFileLegacy: function(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return { success: true, isDownload: true };
        } catch (err) {
            console.error('保存文件失败:', err);
            return { success: false, error: err };
        }
    },

    /**
     * 另存为文件
     * @param {string} content 文件内容
     * @param {string} suggestedName 建议文件名
     * @returns {Promise<Object>} 保存结果
     */
    saveFileAs: async function(content, suggestedName = '未命名.txt') {
        if (this.supportsFileSystemAccess()) {
            return await this._saveFileAsModern(content, suggestedName);
        } else {
            return this._saveFileLegacy(content, suggestedName);
        }
    },

    /**
     * 现代方式另存为
     */
    _saveFileAsModern: async function(content, suggestedName) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] }
                }]
            });

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            return {
                success: true,
                handle: fileHandle,
                name: suggestedName
            };
        } catch (err) {
            if (err.name === 'AbortError') {
                return { success: false, cancelled: true };
            }
            console.error('另存为失败:', err);
            return { success: false, error: err };
        }
    }
};
