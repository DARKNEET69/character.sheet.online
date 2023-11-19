(function (window) {
    function ElementManager() {
        this.elementCounter = 0;
    }
  
    ElementManager.prototype.createElement = function (tagName, attributes = {}) {
        const element = document.createElement(tagName);
        for (let attr in attributes) {
            element.setAttribute(attr, attributes[attr]);
        }
        this.elementCounter++;
        element.id = 'element-' + this.elementCounter;
        document.body.appendChild(element);
        return element;
    };
  
    ElementManager.prototype.editElement = function (elementId, newAttributes) {
        const element = document.getElementById(elementId);
        if (element) {
            for (let attr in newAttributes) {
            element.setAttribute(attr, newAttributes[attr]);
            }
        } else {
            console.error('Element not found');
        }
    };
  
    ElementManager.prototype.deleteElement = function (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.remove();
        } else {
            console.error('Element not found');
        }
    };
  
    window.ElementManager = ElementManager;
})(window);  