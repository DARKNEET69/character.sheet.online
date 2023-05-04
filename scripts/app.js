if (!window.indexedDB) {
  console.log("IndexedDB is not supported.");
}

let db;
const request = window.indexedDB.open("universalCharacterSheetDB", 1);

function connectToDB(callback) {
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
    const objectStore = db.createObjectStore("characters", { keyPath: "id", autoIncrement: true });
    console.log("Object store created successfully");

    callback();
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
  let transaction = db.transaction(["characters"], ((method == "get" || method == "getAll") ? "readonly" : "readwrite"));
  let objectStore = transaction.objectStore("characters");
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
  
        let blockElement = document.createElement("div");
        blockElement.classList.add("block");
  
        let blockTitle = document.createElement("div");
        blockTitle.classList.add("block-title");
        blockTitle.classList.add("minor-button");
        blockTitle.innerHTML = characterObject[propertyBlock].title;
        blockTitle.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
        blockTitle.addEventListener("click", function(e) {
          let propertyPath = e.target.getAttribute("propertyPath");
          console.log("edit " + propertyPath);
          propertyPath = propertyPath.split('.');
          let blockName = propertyPath[propertyPath.length - 1];
          propertyPath = propertyPath.join(".");
          let block = getCharacterProperty(currentCharacter, propertyPath);        
          openBlockSettingsDialog(e, blockName, block.title, block.type);
        });
  
        let blockValue = document.createElement("div");
        let addBlockButton = document.createElement("input");
        addBlockButton.type = "button";
        addBlockButton.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
        addBlockButton.addEventListener("click", (e) => openBlockSettingsDialog(e));
  
        switch(characterObject[propertyBlock].type) {
          case "section":
            blockValue.style.display = "flex";
            blockValue.style.flexDirection = "column";
            blockValue.style.gap = "10px";
            addBlockButton.value = "Add item";
            break;
          case "item":
            blockElement.style.border = "2px dashed var(--page-bg-light-color)";
            blockElement.style.boxShadow = "none";
            blockValue.style.display = "flex";
            blockValue.style.flexDirection = "row";
            blockValue.style.gap = "10px";
            addBlockButton.value = "Add parameter";
            break;
          case "label":
          case "text":
          case "number":
          case "calc":
            blockElement.style.border = "0";
            blockElement.style.boxShadow = "none";
            blockValue = document.createElement("input");          
            if (characterObject[propertyBlock].type == "number") {blockValue.type = "number";}
            blockValue.value = characterObject[propertyBlock].value;
            blockValue.onchange = function(e) {
              let propertyPath = e.target.getAttribute("propertyPath");
              e.target.value = setCharacterProperty(currentCharacter , propertyPath, blockValue.value);
              console.log(propertyPath + ": " + blockValue.value);
              saveChanges();
            }
            break;
        }
        blockValue.classList.add(`block-${characterObject[propertyBlock].type}`);
        blockValue.setAttribute("propertyPath", container.getAttribute("propertyPath") + "." + propertyBlock);
        blockValue.style.width = "100%";
        blockElement.appendChild(blockTitle);
        blockElement.appendChild(blockValue);
        if (addBlockButton.value != "") { blockElement.appendChild(addBlockButton); }
        container.appendChild(blockElement);
        if (typeof characterObject[propertyBlock].value === 'object') { renderBase(characterObject[propertyBlock].value, blockValue) };
      }
    }
  }
}

function getCharacterProperty(characterObject, propertyPath) {
  propertyPath = propertyPath.replaceAll(".", ".value.");
  propertyPath = propertyPath.split(".");
  return propertyPath.reduce((acc, el) => acc = acc[el], characterObject);
}

function setCharacterProperty(characterObject, propertyPath, propertyValue) {
  let schema = characterObject;
  let pList = propertyPath.replaceAll(".", ".value.").split(".");
  let len = pList.length;
  for (let i = 0; i < len-1; i++) {
    let elem = pList[i];
    if ( !schema[elem] ) schema[elem] = {}
    schema = schema[elem];
  }
  schema[pList[len-1]].value = propertyValue;
  console.log(propertyPath + ": " + propertyValue);
  return propertyValue;
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
  const transaction = db.transaction(["characters"], "readwrite");
  const objectStore = transaction.objectStore("characters");
  const request = objectStore.put(currentCharacter);
  request.onerror = function(event) {
    console.error("Error saving character: " + event.target.errorCode);
  };
  request.onsuccess = function(event) {
    console.log("Character saved successfully");
  };
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
        type: "text",
        value: "",
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
            title: "INTELLECT",
            type: "item",
            value: {
              current: {
                title: "CURRENT",
                type: "number",
                value: 5,
              },
              base: {
                title: "BASE",
                type: "number",
                value: 10,
              }
            }
          },        
          agility: {
            title: "AGILITY",
            type: "item",
            value: {
              current: {
                title: "CURRENT",
                type: "number",
                value: 10,
              },
              base: {
                title: "BASE",
                type: "number",
                value: 20,
              }
            }
          },
          
          body: {
            title: "BODY",
            type: "item",
            value: {
              current: {
                title: "CURRENT",
                type: "number",
                value: 20,
              },
              base: {
                title: "BASE",
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
      items: {
        title: "ITEMS",
        type: "item",
        value: {
          text: {
            title: "ITEM",
            type: "text",
            value: ""
          },
          base: {
            title: "KG",
            type: "number",
            value: ""
          },
        },
      },
    },
  },
  actions: {
      value: {    
    },
  },
};
