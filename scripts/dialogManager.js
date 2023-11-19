(function (window) {
    function DialogManager() {
      this.dialogCounter = 0;
    }
  
    DialogManager.prototype.createDialog = function (title, message, inputFields = [], customStyles) {  
        this.dialogCounter++;
        let dialogId = 'dialog-' + this.dialogCounter;
        let dialog = document.createElement("dialog");
        let dialogContainer = document.createElement("div");
        dialogContainer.classList.add("dialog-container");
        dialog.appendChild(dialogContainer);

        let dialogTitle = document.createElement("div");
        dialogTitle.classList.add("dialog-title");
        dialogTitle.innerHTML = title;
        dialogContainer.appendChild(dialogTitle);

        let closeButton = document.createElement("div");
        closeButton.classList.add("close-button");
        closeButton.innerHTML = "✕";
        closeButton.addEventListener('click', function () {
            DialogManager.prototype.closeDialog(dialogId);
            DialogManager.prototype.deleteDialog(dialogId);
        });
        dialogContainer.appendChild(closeButton);
    
        let dialogMessage = document.createElement('p');
        dialogMessage.classList.add('dialog-message');
        dialogMessage.innerText = message;
        dialogContainer.appendChild(dialogMessage);
    
        if (inputFields.length > 0) {
            inputFields.forEach(function (field) {
                if (field.tag === 'input') {
                    const input = document.createElement('input');
                    input.type = field.type;
                    input.name = field.name;
                    input.placeholder = field.placeholder;
                    input.required = field.required || false;
                    dialogContainer.appendChild(input);
                } else if (field.tag === 'button') {
                    const button = document.createElement('input');
                    button.type = 'button';
                    button.value = field.value;
                    //button.addEventListener('click', field.onclick);
                    dialogContainer.appendChild(button);
                } else if (field.tag === 'select') {
                    const select = document.createElement('select');
                    select.name = field.name;
        
                    field.options.forEach(function (option) {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.text = option.text;
                    if (option.selected) {
                        optionElement.selected = true;
                    }
                    select.appendChild(optionElement);
                    });
        
                    dialogContainer.appendChild(select);
                }
            });
        }
        
        let defaultStyles = `
        dialog {
            box-sizing: border-box;
            color: var(--minor-text-color);
            border: var(--block-border);
            background: var(--block-bg-color);
            padding: 10px;
            margin: auto;
            font-family: 'Roboto', sans-serif;
            font-size: 14px;
            border-radius: 10px;
            box-shadow: var(--block-shadow);
            max-width: 1000px;
            width: calc(100vw - 20px);
        }    
        dialog::backdrop {
            width: 100%;
            background-color: rgb(0 0 0 / 0.5);
            backdrop-filter: blur(5px);
        }
        .dialog-container{
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .dialog-title {
            text-align: center;
        }
        .close-button {
            position: absolute;
            cursor: pointer;
            top: 5px;
            right: 10px;
        }`;
    
        let dialogStyle = document.createElement('style');
        dialogStyle.innerHTML = (customStyles ? customStyles : "") + defaultStyles;
        dialog.appendChild(dialogStyle);
        dialog.id = dialogId;
        document.body.appendChild(dialog);
    
        return dialog;
    };
  
    DialogManager.prototype.openDialog = function (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.showModal();
        } else {
            console.error('Dialog not found');
        }
    };
  
    DialogManager.prototype.closeDialog = function (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.close();
        } else {
            console.error('Dialog not found');
        }
    };
  
    DialogManager.prototype.deleteDialog = function (dialogId) {
        const dialog = document.getElementById(dialogId);
        if (dialog) {
            dialog.remove();
        } else {
            console.error('Dialog not found');
        }
    };
  
    window.DialogManager = DialogManager;
})(window);