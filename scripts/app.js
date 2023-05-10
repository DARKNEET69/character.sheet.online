let db;
let request;

function getIndexedDB(callback) {
  request = indexedDB.open("universalCharacterSheetDB", 1);

  request.onerror = function(event) {
    console.error("Database error: " + event.target.errorCode);  
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Database opened successfully");
    callback();
  };

  request.onupgradeneeded = function(event) {
    db = event.target.result;  
    const characterSheetsObjectStore = db.createObjectStore("characterSheets", { keyPath: "id"});
    const sheetTemplatesobjectStore = db.createObjectStore("sheetTemplates", { keyPath: "id"});
    console.log("Object store created successfully");  
  };
}

function deleteIndexedDB() {
  request = indexedDB.deleteDatabase("universalCharacterSheetDB");
  request.onsuccess = function () {
      console.log("Deleted database successfully");
  };
  request.onerror = function () {
      console.log("Couldn't delete database");
  };
  request.onblocked = function () {
      console.log("Couldn't delete database due to the operation being blocked");
  };
}

function getCharacterData(characterId) {
  return changeCharacterData("get", characterId);
}

function getCharactersData() {
  return changeCharacterData("getAll");
}

function setCharacterData(characterObject) {
  let request = getCharacterData(characterObject.Id);

  request.onsuccess = () => {
    changeCharacterData("update", characterObject);
  }

  request.onerror = () => {
    changeCharacterData("add", characterObject);
  }

  return request;
}

function deleteCharacterData(characterId) {
  return changeCharacterData("delete", characterId);
}

function changeCharacterData(method, value) {
  const db = request.result;
  let transaction = db.transaction(["characterSheets"], ((method == "get" || method == "getAll") ? "readonly" : "readwrite"));
  let objectStore = transaction.objectStore("characterSheets");
  let changeRequest;
  
  switch(method) {
    case "get":
      changeRequest = objectStore.get(value);
      break;

    case "getAll":
      changeRequest = objectStore.getAll();
      break;

    case "add":
      changeRequest = objectStore.add(value);
      break;

    case "update":
      changeRequest = objectStore.put(value);
      break;

    case "delete":
      changeRequest = objectStore.delete(value);
      break;
  }

  changeRequest.onerror = function(event) {
    console.error("Error " + method + " character: " + event.target.errorCode);
  }

  changeRequest.onsuccess = function(event) {
    console.log("Character " + method + " successfully");
    return changeRequest;
  }
}

function renderCharacterProperties(characterObject, container) {
  renderBase(characterObject, container);
  let addSectionButton = document.createElement("input");
  addSectionButton.type = "button";
  addSectionButton.value = "Add section"
  addSectionButton.style.width = "100%";
  addSectionButton.setAttribute("propertyPath", container.getAttribute("propertyPath"));
  addSectionButton.addEventListener("click", (e) => openBlockSettingsDialog(e));
  container.appendChild(addSectionButton);

  function renderBase(characterObject, container){
    for (let propertyBlock in characterObject) {
      if (typeof characterObject[propertyBlock] === "object") {
  
        let blockElement;  
        let blockTitle;  
        let blockValue = document.createElement("div");
        let addBlockButton = document.createElement("input");
        addBlockButton.type = "button";
        addBlockButton.style.height = "fit-content";
        addBlockButton.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
        addBlockButton.addEventListener("click", (e) => openBlockSettingsDialog(e));
  
        switch(characterObject[propertyBlock].type) {
          case "section":
            blockElement = document.createElement("div");
            blockTitle = document.createElement("div");
            blockValue.style.display = "flex";
            blockValue.style.flexDirection = "column";
            blockValue.style.gap = "10px";
            addBlockButton.value = "Add item";
            break;
          case "item":
            blockElement = document.createElement("div");
            blockTitle = document.createElement("div");
            blockTitle.style.textAlign = "start";
            blockElement.style.border = "2px dashed var(--page-bg-color)";
            blockElement.style.boxShadow = "none";
            blockValue.style.display = "flex";
            blockValue.style.flexDirection = "row";
            blockValue.style.gap = "10px";
            addBlockButton.value = "➕";
            break;
          case "label":
          case "number":
          case "calc":
            blockElement = document.createElement("div");
            blockTitle = document.createElement("div");
            blockElement.style.border = "0";
            blockElement.style.boxShadow = "none";
            blockValue = document.createElement("input");          
            if (characterObject[propertyBlock].type == "number") {
              blockValue.type = "number";
              blockValue.setAttribute("pattern", "\\d*");
            }
            blockValue.value = characterObject[propertyBlock].value;
            blockValue.onchange = function(e) {
              let propertyPath = e.target.getAttribute("propertyPath");
              setCharacterProperty(propertyPath, e.target.value);
              console.log(propertyPath + ": " + e.target.value);
            }
            break;
          case "text":
            blockElement = document.createElement("div");
            blockTitle = document.createElement("div");
            blockElement.style.border = "0";
            blockElement.style.boxShadow = "none";
            blockValue = document.createElement("div");
            blockValue.setAttribute("contenteditable", "true");
            blockValue.innerHTML = characterObject[propertyBlock].value == "undefined" ? "" : characterObject[propertyBlock].value;
            blockValue.oninput = function(e) {
              let propertyPath = e.target.getAttribute("propertyPath");
              setCharacterProperty(propertyPath, e.target.innerHTML);
              console.log(propertyPath + ": " + e.target.innerHTML);
            }
            break;
          case "button":
            blockElement = document.createElement("input");
            blockElement.type = "button"
            break;
        }

        if (characterObject[propertyBlock].type == "button") {
          blockElement.value = characterObject[propertyBlock].title;
          blockElement.setAttribute("onclick", characterObject[propertyBlock].value);
          blockElement.style.color = "var(--major-text-color)";
        }
        else {
          blockTitle.classList.add("block-title");
          blockTitle.classList.add("minor-button");
          if (characterObject[propertyBlock].title == "") {
            blockTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="15" height="15" x="0" y="0" viewBox="0 0 24 24" style="enable-background:new 0 0 512 512" xml:space="preserve"><g><path d="M1.172 19.119A4 4 0 0 0 0 21.947V24h2.053a4 4 0 0 0 2.828-1.172L18.224 9.485l-3.709-3.709ZM23.145.855a2.622 2.622 0 0 0-3.71 0l-3.506 3.507 3.709 3.709 3.507-3.506a2.622 2.622 0 0 0 0-3.71Z" fill="currentColor" data-original="#000000"></path></g></svg>`;
            blockTitle.style.alignSelf = "end";
          }
          else {
            blockTitle.innerHTML = characterObject[propertyBlock].title;
          }
          blockTitle.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
          blockTitle.addEventListener("click", function(e) {
            let propertyPath = e.currentTarget.getAttribute("propertyPath");
            console.log("edit " + propertyPath);
            propertyPath = propertyPath.split('.');
            let blockName = propertyPath[propertyPath.length - 1];
            propertyPath = propertyPath.join(".");
            let block = getCharacterProperty(propertyPath);        
            openBlockSettingsDialog(e, blockName, block.title, block.type);
          });
          blockElement.classList.add("block");
          blockValue.classList.add(`block-${characterObject[propertyBlock].type}`);
          blockValue.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
          blockValue.style.width = "100%";
          blockElement.appendChild(blockTitle);
          blockElement.appendChild(blockValue);
        }
        container.appendChild(blockElement);
        if (typeof characterObject[propertyBlock].value === 'object') { renderBase(characterObject[propertyBlock].value, blockValue) };
        if (addBlockButton.value != "") { blockValue.appendChild(addBlockButton); }
      }
    }
  }
}

function openBlockSettingsDialog(e, name = "", title = "", type = "section") {
  let propertyPath = e.target.getAttribute("propertyPath");
  console.log("edit " + propertyPath);
  let blockSettingsDialog = document.getElementById("blockSettingsDialog");
  blockSettingsDialog.querySelector("#blockSave").setAttribute("propertyPath", propertyPath);
  blockSettingsDialog.querySelector("#blockDelete").setAttribute("propertyPath", propertyPath);
  blockSettingsDialog.querySelector("#blockName").value = name;
  blockSettingsDialog.querySelector("#blockTitle").value = title;
  blockSettingsDialog.querySelector("#blockType").value = type;
  blockSettingsDialog.showModal();
}

function saveBlockSettings(e) {
  propertyPath = e.submitter.getAttribute("propertyPath");
  let blockSettingsDialog = document.getElementById("blockSettingsDialog");
  propertyName = blockSettingsDialog.querySelector("#blockName").value;
  propertyTitle = blockSettingsDialog.querySelector("#blockTitle").value;
  propertyType = blockSettingsDialog.querySelector("#blockType").value;
  const properties = propertyPath.replaceAll(".", ".value.").split('.');
  let currentObj = currentCharacter;
  if (e.submitter.id == "blockSave") {
    for (let i = 0; i < properties.length - 1; i++) {
      currentObj = currentObj[properties[i]];
    }
    if (!currentObj[properties[properties.length - 1]].value[propertyName] && currentObj[properties[properties.length - 1]].value == "") { currentObj[properties[properties.length - 1]].value = {}; }
      currentObj[properties[properties.length - 1]].value[propertyName] = {
        title: propertyTitle,
        type: propertyType,
        value: "",
      };
  }
  else if (e.submitter.id == "blockDelete") {;
    for (var i = 0; i < properties.length - 1; i++) {
      currentObj = currentObj[properties[i]];
      if (typeof currentObj === 'undefined') {
        return;
      }
    }
    delete currentObj[properties[properties.length - 1]]
  }
  saveChanges();
}

function saveChanges() {
  const transaction = db.transaction(["characterSheets"], "readwrite");
  const objectStore = transaction.objectStore("characterSheets");
  const request = objectStore.put(currentCharacter);
  request.onerror = function(event) {
    console.error("Error saving character: " + event.target.errorCode);
  };
  request.onsuccess = function(event) {
    console.log("Character saved successfully");
  };
}

//--- users functions ---//

function roll(dice, count) {
  let sum = 0;
  for (let i = 1; i <= count; i++) {
    sum += Math.floor(Math.random() * dice);
  }
  return sum;
}

function getCharacterProperty(propertyPath) {
  propertyPath = propertyPath.replaceAll(".", ".value.");
  propertyPath = propertyPath.split(".");
  return propertyPath.reduce((acc, el) => acc = acc[el], currentCharacter);
}

function setCharacterProperty(propertyPath, propertyValue) {
  let schema = currentCharacter;
  let pList = propertyPath.replaceAll(".", ".value.").split(".");
  let len = pList.length;
  for (let i = 0; i < len-1; i++) {
    let elem = pList[i];
    if ( !schema[elem] ) schema[elem] = {}
    schema = schema[elem];
  }
  switch(pList[len-1]) {
    case "id":
    case "name":
    case "avatar":
    case "sheet":
      schema[pList[len-1]] = propertyValue;
      break;
    default:
      schema[pList[len-1]].value = propertyValue;
      break;
  }
  console.log(propertyPath + ": " + propertyValue);
  saveChanges();
  return propertyValue;
}



const defaultCharacterSheet = {
  id: "",
  name: "",
  avatar: "",
  sheet: "",
  bio: {
    value: {
      about: {
        title: "ABOUT",
        type: "section",
        value: {
          base: {
            title: "",
            type: "text",
            value: "",
          },
        },
      },
    },
  },
  attributes: {
    value: {
      baseStats: {
        title: "BASE STATS",
        type: "section",
        value: {
          intellect: {
            title: "Intellect",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: 5,
              },
              base: {
                title: "base",
                type: "number",
                value: 10,
              }
            }
          },        
          agility: {
            title: "Agility",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: 10,
              },
              base: {
                title: "base",
                type: "number",
                value: 20,
              }
            }
          },
          
          body: {
            title: "Body",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: 20,
              },
              base: {
                title: "base",
                type: "number",
                value: 30,
              }
            }
          },        
        }
      },
      baseSkills: {
        title: "BASE SKILLS",
        type: "section",
        value: {
          fight: {
            title: "Fight",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: "",
              },
              base: {
                title: "base",
                type: "number",
                value: "",
              }
            }
          },
          persuasion: {
            title: "Persuasion",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: "",
              },
              base: {
                title: "base",
                type: "number",
                value: "",
              }
            }
          },
          stealth: {
            title: "Stealth",
            type: "item",
            value: {
              current: {
                title: "current",
                type: "number",
                value: "",
              },
              base: {
                title: "base",
                type: "number",
                value: "",
              }
            }
          }
        }
      }
    },    
  },
  inventory: {
    value: {
      money: {
        title: "MONEY",
        type: "section",
        value: {
          base: {
            title: "",
            type: "number",
            value: "",
          },
        },
      },
      backpack: {
        title: "Backpack",
        type: "section",
        value: {
          base: {
            title: "",
            type: "item",
            value: {
              text: {
                title: "name",
                type: "text",
                value: ""
              },
              base: {
                title: "weight",
                type: "number",
                value: ""
              },
            },
          },
        },
      },
    },
  },
  actions: {
    value: {    
      attackActions: {
        title: "ATTACK ACTIONS",
        type: "section",
        value: {
          meleeAttack: {
            title: "melee attack",
            type: "button",
            value: `alert("пошул нахуй")`,
          },
          rangeAttack: {
            title: "range attack",
            type: "button",
            value: "",
          },
        },
      },
    },
  },
};
