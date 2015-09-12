(function(root, mod) {
    if (typeof exports == "object" && typeof module == "object") return mod(exports); // CommonJS
    if (typeof define == "function" && define.amd) return define([ "exports" ], mod); // AMD
    mod(root.jsdoc2tern || (root.jsdoc2tern = {})); // Plain browser env
})(this,function(exports) {
  "use strict";
  
  var Generator = exports.Generator = function(options) {
    this.options = options;
  };
  
  Generator.prototype.process = function(jsDoc) {
    var ternDef = {
      "!name" : this.options.name,
      "!define" : {
        
      }
    };
    if (this.options.initialize) this.options.initialize(ternDef);
    this.visitDoc(jsDoc, ternDef);
    return ternDef;
  };

  Generator.prototype.visitDoc = function(jsDoc, ternDef) { 
    // Iterate over all jsdoc items
    for ( var i = 0; i < jsDoc.length; i++) {
      var jsdocItem = jsDoc[i];
      var parent = getParent(jsdocItem, ternDef);
      if (parent) {
        var type = null, description = jsdocItem.description; 
        switch(jsdocItem.kind) {         
          case "member":
            var properties = jsdocItem.properties;
            if (properties && properties[0]) {
              var prop = properties[0];
              description = prop.description;
              type = getParamType(prop);
            }        
            break;
          case "function":
            type = getFunctionType(jsdocItem);              
            break;
          case "class":
            type = getFunctionType(jsdocItem);              
            break;
          case "event":
            type = null;            
            break;
          case "mixin":
            type = null;            
            break;
          case "constant":
            type = getParamType(jsdocItem);             
            break;
          case "typedef":
            type = null;            
            break;
          case "package":
            type = null;            
            break;                  
          default:
            //console.log("   " + jsdocItem.name)
        }
        if (type) parent["!type"] = type;
        //if (description) parent["!doc"] = description;
      }
      
      /*switch(jsdocItem.kind) {
        case "class":
          var parent = getParent(jsdocItem, ternDef);
          var ternClass = parent[jsdocItem.name] = {};
          var type = getFunctionType(jsdocItem);
          if (type) ternClass["!type"] = type;
          break;
        default:
          console.log(jsdocItem.kind)
      }*/
      
      
      /*if (jsdocItem.kind == "module") {
    	// create module
        var mod = getTernModule(jsdocItem.name, ternDef);
        if (jsdocItem.description) mod["!doc"] = jsdocItem.description;
      } else {
        var parent = getParent(jsdocItem, ternDef);
    	if (parent) {
    	  var type = null, description = jsdocItem.description; 
  	      switch(jsdocItem.kind) {	       
	        case "member":
	          type = null;	          
	          break;
	        case "function":
		      type = getFunctionType(jsdocItem);	          
		      break;
	        case "class":
		      type = getFunctionType(jsdocItem);	          
		      break;
	        case "event":
		      type = null;	          
		      break;
	        case "mixin":
		      type = null;	          
		      break;
	        case "constant":
		      type = getParamType(jsdocItem);	          
		      break;
	        case "typedef":
		      type = null;	          
		      break;
	        case "package":
		      type = null;	          
		      break;		          
	        default:
	          //console.log("	" + jsdocItem.name)
	      }
  	      if (type) parent["!type"] = type;
  	      if (description) parent["!doc"] = description;
    	}
      }*/
    }
  }
  
  function getParent(jsdocItem, ternDef) {
    var name = jsdocItem.memberof;
    if (!name) return ternDef;
    var names = name.split(".");
    var parent = ternDef;
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      if (!parent[n]) parent[n] = {};
      parent = parent[n];
    }
    return parent[jsdocItem.name] ? parent[jsdocItem.name] : parent[jsdocItem.name] = {};
  }
  
  var getTernModule = function(moduleName, ternDef) {
	  var mod = ternDef[moduleName];
	  if (!mod) {
        mod = ternDef[moduleName] = {};
	  }
	  return mod;
  }
  
  /*function getModuleName(name) {
	return name.substring("module:".length, name.length);	
  }*/
  
  var getParentA = function(jsdocItem, ternDef) {
    var name = jsdocItem.memberof ? jsdocItem.memberof : jsdocItem.name;
    if (startsWith(name, "module:")) {
      name = name.substring("module:".length, name.length);
      var index = name.indexOf("."), moduleName = index == -1 ? name : name.substring(0, index);
      var parent = getTernModule(moduleName, ternDef);
      if (index != -1) {
        var names = name.substring(index + 1, name.length).split(".");
        for (var i = 0; i < names.length; i++) {
          if (parent[names[i]]) {
            parent = parent[names[i]]; 
          } else {
            parent = parent[names[i]] = {};
          }
        }
      }
      return jsdocItem.memberof ? parent[jsdocItem.name] = {} : parent;
    }
    /*if (startsWith(jsdocItem.memberof, "module:")) {
      var moduleName = getModuleName(jsdocItem.memberof);
      var ternModule = getTernModule(moduleName, ternDef);
      return ternModule[jsdocItem.name] = {};
    }*/
    return null;
  }

  var getFunctionType = function(jsdocItem) {
    var type = "fn(", params = jsdocItem.params;
    if (params) {
      for (var i = 0; i < params.length; i++) {
    	if (i > 0) type+= ", ";
        var param = params[i];
    	type+= param.name; 
    	type+= ": ";
    	type+= getParamType(param);
	  }
    }
    type+= ")";
    if (jsdocItem.returns) {
      type+= " -> ";  	
      type+= getParamType(jsdocItem.returns);
    }
    return type;
  }
  
  var getParamType = function(param)  {
    var jsdocType = param.type;
    if (jsdocType) {
      var type  = "";
      var names = jsdocType.names;
      for (var i = 0; i < names.length; i++) {
    	  if (i > 0) type+= "|";
    	  type += getTernType(names[i]);
	  }
      return type != "" ? type : "?";
    }
	return "?";
  }
  
  var getTernType = function(name) {
	switch(name.toLowerCase()) {
	  case "string":
		return "string";
	  case "number":
		return "number";
	  case "boolean":
	  case "bool":		  
		return "bool";
	  case "*":		  
		return "?";		
      default:
    	if (startsWith(name, "Array")) {
    	  // todo : improve to extract type of the array Array.<string> => [string]
    	  return "[?]";	
    	}
        if (startsWith(name, "module:")) {
          //name = getModuleName(name);
        	//return "?";
    	}
        if (name.indexOf("/") != -1) {
        	return "?";
        }
        
        var type = "";
  	    type += "+";
  	    type += name;
  	    return type;    	  
	}
  }
  var startsWith = function(str, prefix) {
	return str && str.slice(0, prefix.length) == prefix;
  }
  
  var endsWith = function(str, suffix) {
    return str && str.slice(-suffix.length) == suffix;
  }  
  
  
  
  
  
  
  function isGlobal(yuiClassItem) {
    return yuiClassItem.name == "YUI_config";
  }
  
  Generator.prototype.isIgnoreClassItem = function(yuiClassItem) {    
    return this.options.isIgnoreClassItem ? this.options.isIgnoreClassItem(yuiClassItem) : false;
  }
  
  Generator.prototype.getTernClass = function(className, parent, moduleName, jsDoc, fullClassName, ternDef) {
	// get name
    var name = className;
    if (className.indexOf('.') != -1) {
      var names = className.split('.'), length = names.length -1;
      var locFullClassName = "";
      for (var i = 0; i < length; i++) {
        if (i > 0) locFullClassName+=".";
        locFullClassName+=names[i];
        parent = this.getTernClass(names[i], parent, moduleName, jsDoc, locFullClassName, ternDef);
      }
      name = names[length];
    }
    
    var ternClass = parent[name];
    if (!ternClass) {
      var yuiClass = fullClassName ? jsDoc.classes[fullClassName] : jsDoc.classes[className], type, proto, effects, doc, url, data;
      if (!yuiClass) yuiClass = jsDoc.classes[className]
      if (yuiClass) {      
        // !proto
        proto = this.getProto(yuiClass, jsDoc, true);
        effects = null;
        // !doc
        doc = null;
        // if (yuiClass.description)
          //  ternClass["!doc"] = yuiClass.description;
        // !url
        url = this.options.baseURL ? getURL(this.options.baseURL, className) : null;
        var uses = yuiClass["uses"], forClass = this.getForClass(className, moduleName, jsDoc), augments = [], exts = [];
        if (!forClass) {
          // !type
          type = this.getTernType(yuiClass, jsDoc, ternDef);
        }
        if (uses) {
          for (var i = 0; i < uses.length; i++) {
            var useClassName = uses[i], useFullClassName = getClassName(useClassName, jsDoc, this.options.isSubModule);
            if (useFullClassName && useFullClassName != forClass) {
              if (isExtensionFor(useClassName, className, jsDoc)) {
                exts.push(useFullClassName);
              } else {
                augments.push(useFullClassName);
              }
            }
          }                    
        } 
        if (augments.length > 0 || exts.length > 0 || forClass) {
          data = {};
          if (augments.length > 0) data["augments"] = augments;
          if (exts.length > 0) data["extends"] = exts;
          if (forClass) data["for"] = forClass;
        }
      }
      ternClass = createTernDefItem(parent, name, type, proto, effects, url, doc, data);
    }    
    return ternClass;
  }
  
  Generator.prototype.getForClass = function(className, moduleName, jsDoc) {
    var forCLass = this.options.getForClass ? this.options.getForClass(className) : null;
    if (forCLass) return forCLass;
    var yuiClass = jsDoc.classes[className];
    var forClassModuleName = yuiClass ? yuiClass["module"] && yuiClass["module"].replace(/-/g, '_') : null;
    if (forClassModuleName && forClassModuleName != moduleName) return forClassModuleName + "." + className;
  }
  
  var getTernClassConfig = function(className, parent, jsDoc) {
    var names = getConfigType(className).split(".");
    var ternClass = parent;
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      ternClass = parent[name];
      if (!ternClass) ternClass = parent[name] = {};
      parent = ternClass;
    }
    var yuiClass = jsDoc.classes[className];
    if (yuiClass) {
      var yuiExtends = yuiClass["extends"];
      if (yuiExtends) ternClass["!proto"] = getConfigType(yuiExtends);      
      /*var proto = this.getProto(yuiClass, jsDoc);
      if (proto) {
        ternClass["!proto"] = getConfigType(proto);
      }*/
    }
    return ternClass;
  }
    
  var getTernClassPrototype = function(ternClass) {
    var ternPrototype = ternClass["prototype"];
    if (!ternPrototype) ternClass["prototype"] = ternPrototype = {};
    return ternPrototype;
  }  
  
  var isAccess = function(yuiClassItem, isSubModule) {
    if (isSubModule && yuiClassItem.file && (startsWith(yuiClassItem.file, "yui3") || startsWith(yuiClassItem.file, "lib/yui3"))) {
      return false;
    }
    var access = yuiClassItem["access"];
    return access != 'private' && access != 'protected';
  }
  
  var isStatic = function(yuiClassItem) {
    return yuiClassItem["static"] === 1 || "YUI_config" == yuiClassItem.name;
  }
  
  var isEventType = function(yuiClassItem) {
    var itemtype = yuiClassItem["itemtype"];
    return itemtype === 'event';  
  }
  
  var isAttributeType = function(yuiClassItem) {
    var itemtype = yuiClassItem["itemtype"];
    return itemtype === 'attribute';  
  }
  
  var isExtensionFor = function(useClassName, className, jsDoc) {
    var clazz = jsDoc.classes[useClassName], extension_for = clazz ? clazz.extension_for : null;
    if (extension_for) {
      for (var i = 0; i < extension_for.length; i++) {
        if (extension_for[i] == className) return true;
      }
    }
    return false;
  }
  
  var getDescription = function(yuiClassItem) {
	var description = yuiClassItem["description"];
	if (!description) return null;
	description = description.replace(/['$']/g, "");
	return description;
  }
  
  var getURL = function(baseURL, className, itemtype, name) {
    var url = baseURL;
    if (!endsWith(baseURL, '/')) {
      url += '/';
    }
    url += 'classes/';
    url += className;
    url += '.html';
    if (itemtype && name) {
      url += '#';
      url += itemtype;
      url += '_';
      url += name;
    }
    return url;
  }
  
  function isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }
  
  var getTernModuleOLD = function(moduleName, ternDef, isSubModule, jsDoc) {
    // YUI module uses '-' in their name, and tern cannot support that, replace '-' with '_'
    var name = moduleName.replace(/-/g, '_');
    var parent = ternDef["!define"];
    if (isSubModule) {
    	var sub = parent["_yui"];
    	if (!sub) sub = parent["_yui"] = {};
    	parent = sub;
    }    
    var ternModule = parent[name];
    if (!ternModule) {
      // create module
      ternModule = parent[name]= {};
      var data = {}, mods = jsDoc.modules, mod = mods ? mods[moduleName] : null;      
      if (name != moduleName ) data["module"] =  moduleName;
      if (mod && mod.submodules) {
        var submodules = {};
        for(var submodule in mod.submodules) {
          submodules[submodule] = {};
        }
        if (!isEmpty(submodules)) {
          if (!data) data = {};
          data["submodules"] = submodules;
        }
      }
      if (!isEmpty(data)) ternModule["!data"] = data;
    }
    return ternModule;
  }
  
  var createTernDefItem = function(parent, name, type, proto, effects, url, doc, data) {
    var item = parent[name] = {};
    if (type) item["!type"] = type;
    if (effects) item["!effects"] = effects;
    if (url) item["!url"] = url;
    if (doc && doc != '') item["!doc"] = doc;
    if (data) item["!data"] = data;
    if (proto) getTernClassPrototype(item)["!proto"] = proto;
    return item;
  }
  
  // YUI -> Tern type
  
  var getFirstPart = function(yuiType, c) {
    var index = yuiType.indexOf(c);
	if (index != -1) {
	  yuiType = yuiType.substring(0, index);
	  yuiType = yuiType.trim();
	}
	return yuiType;
  }
  
  var extractYUIType = exports.extractYUIType= function(yuiType) {
    if (!yuiType) return null;
    //yuiType = yuiType.trim();
    var index = -1;
       
    if (startsWith(yuiType, '{')) {
      index = yuiType.indexOf('}');
      yuiType = yuiType.substring(1, index != -1 ? index : yuiType.length);
    }
    
    var yuiTypes = null;
    if (yuiType.indexOf("/") != -1) {
      yuiTypes = yuiType.split("/");
    } else {
      yuiTypes = yuiType.split("|");
    }
    var filterYuiTypes = [];
    for (var i = 0; i < yuiTypes.length; i++) {
      var t = yuiTypes[i].trim();
      // ex : {ArrayList|Widget} or {Any}
      if (startsWith(t, '{')) {
        index = t.indexOf('}');
        t = t.substring(1, index != -1 ? index : t.length);
      }
      // ex : {string: boolean}
      t = getFirstPart(t, ':');
      // ex : Object*
      t = t.replace(/[*]/g, '');
      t = t.trim();
      
      if (t.length > 0 && t != "null" && t != "undefined") filterYuiTypes.push(t);
    }
    return filterYuiTypes;
  }
  
  var getTernTypeOLD = exports.getTernType = function(yuiClass, jsDoc, isSubModule, ternDef) {
	var itemtype = yuiClass["itemtype"];
	if (itemtype == 'config' && yuiClass.params) {
		// case for EventTarget which has params and itemtype=config (and type=Boolean)
		// we force it to method.
		itemtype = 'method'; 
	}
    switch(itemtype) {
      case 'method':
    	var className = yuiClass["class"], methodName = yuiClass.name, params = yuiClass.params, returnValue = yuiClass["return"], isChainable = yuiClass["chainable"] === 1, isConstructor = yuiClass["is_constructor"] === 1;
    	var name = className + methodName.substring(0, 1).toUpperCase() + methodName.substring(1, methodName.length);
        return getFunctionTernType(name, params, returnValue, isChainable, isConstructor, jsDoc, isSubModule, ternDef);
      break;
      case 'property':
      case 'attribute':  
    	var yuiType = yuiClass.type;
    	return getPropertyTernType(yuiType, null, jsDoc, ternDef);
      case 'event':
        break;
      case 'config':
    	var yuiType = yuiClass.type;
      	return getPropertyTernType(yuiType, null, jsDoc, ternDef);
      default:
      	var className = yuiClass.name, params = yuiClass.params, returnValue = yuiClass["return"], isChainable = yuiClass["chainable"] === 1, isConstructor = yuiClass["is_constructor"] === 1;
        return getFunctionTernType(className, params, returnValue, isChainable, isConstructor, jsDoc, isSubModule, ternDef);
    }	  
  }
  
  var getFunctionTernType = function(className, params, returnValue, isChainable, isConstructor, jsDoc, isSubModule, ternDef) {
    var type = 'fn(';
    if (params) {
      for ( var i = 0; i < params.length; i++) {
        var param = params[i], name = toTernName(param.name);
        if (i > 0)
          type += ', ';
        type += name;
        if (param.optional)
          type += '?';
        type += ': ';
        if (param.type) {
          if (param.type == 'Object') {
            if (param.props  && param.props.length > 0) {
              // param Object with properties
              var paramObjClass = null;
              if (className == null) {
                var index = 0, paramObjName = getConfigType("param" + index);
                while(true) {
                  paramObjClass = getTernClassConfig("param" + index, ternDef["!define"], jsDoc);
                  if (isEmpty(paramObjClass)) {                  
                    break;
                  }
                  index++;
                  paramObjName = getConfigType("param" + index);
                }
              } else {
                paramObjClass = getTernClassConfig(className, ternDef["!define"], jsDoc);
                paramObjName = getConfigType(className);
              }
              for (var j = 0; j < param.props.length; j++) {
                var prop = param.props[j], paramObjItem = paramObjClass[prop.name] = {}, paramDoc = getDescription(prop), 
                    paramType = getPropertyTernType(prop.type, null, jsDoc, ternDef);
                if (paramType) paramObjItem["!type"] = paramType;
                if (paramDoc) paramObjItem["!doc"] = paramDoc;
              }
              type += "+" + paramObjName;
            } else if (param.name == 'config') {
                // case for config Object Literal (filled with attribute itemtype)
                type += "+" + getConfigType(className);
            } else {              
                type += "+Object"; 
            }
          } else {
            type += getPropertyTernType(param.type, param.props, jsDoc, isSubModule, ternDef); 
          }
        } else {
            type += '?';	
        }
      }
    }
    type += ')';
    if (isChainable) {
      type += ' -> !this';
    }
    /*else if (isConstructor) {
      type += ' -> +';
      type += getClassName(className, jsDoc, isSubModule);
    }*/
     else if (returnValue) {
      type += ' -> ';
      type += getPropertyTernType(returnValue.type, returnValue.props, jsDoc, ternDef);
    }
    return type;	  
  }

  var getConfigType = function(className) {
    var index = className.lastIndexOf('.'), name = index !=- 1 ? className.substring(index+1, className.length) : className;
    return "config." + className + "Config";  
  }
  
  var getPropertyTernType = exports.getPropertyTernType = function(yuiType, props, jsDoc, isSubModule, ternDef) {
    if (!yuiType) return "?";
    var types = "", yuiTypes = extractYUIType(yuiType);
    if (yuiTypes) {      
      for (var i = 0; i < yuiTypes.length; i++) {
        var type = toTernType(yuiTypes[i], props, jsDoc, isSubModule, ternDef);
        if (type) {
         if (startsWith(type, "fn(")) {
           if (i == 0) return type;
           continue;
         }
         if (types.length > 0) types+= "|";
         types+= type;
        }
      }
    }
    return types.length > 0 ? types : "?";
  }
  
  function toTernType(type, props, jsDoc, isSubModule, ternDef) {
//    var type = extractYUIType(yuiType);
//    if (!type) return null;

    // is array?
    var isArray = false, index = type.indexOf('[');
    if (index > 0) {
      type = type.substring(0, index);
      isArray = true;
    }
    type = type.trim();
    switch (type.toLowerCase()) {
    case 'function':
      return getFunctionTernType(null, props, null, false, false, jsDoc, isSubModule, ternDef);
    case 'any':    
      return '?';
    case 'object':      
      return formatType('Object', isArray, true);
    case 'array':    
      return '[?]';      
    case 'null':
      return null;
    case 'string':
      return formatType('string', isArray);
    case 'number':
    case 'int': 
    case 'num':
    case 'float':       
      return formatType('number', isArray);
    case 'boolean':
    case 'false':
    case 'true':      
      return formatType('bool', isArray);
    default:
      return formatType(getClassName(type, jsDoc, isSubModule), isArray, true);
    }
  }

  var getModuleNameOLD = function(yuiClassItem, jsDoc, dontReplace) {
    //var className = yuiClassItem["class"];
    //var yuiClass = jsDoc.classes[className];
    var moduleName = /*yuiClass ? yuiClass["module"] :*/ yuiClassItem["module"];
    return dontReplace ? moduleName : moduleName.replace(/-/g, '_');
  }
  
  var getClassName = function(className, jsDoc, isSubModule) {
    var yuiClass = jsDoc.classes[className];
    if (yuiClass && yuiClass.module) {
      var name = yuiClass.module.replace(/-/g, '_') + '.' + className;
      return name;
    }
    return className;
  } 
  
  Generator.prototype.getProto = function(yuiClassItem, jsDoc, withPrototype) {
    var yuiExtends = yuiClassItem["extends"];
    if (!yuiExtends) {
	  return this.options.getProto ? this.options.getProto() : null;
    }
    var className = getClassName(yuiExtends, jsDoc, this.options.isSubModule)
    return withPrototype ? (className + '.prototype') : className;
  }
  
  var toTernName = exports.toTernName = function(yuiName) {
    var name = yuiName;
    name = name.replace(/-/g, '');
    name = extractName(name, '*');
    name = extractName(name, ',');
    // ex : @param
    name = extractName(name, '@');
    // ex : prepend=false
    name = extractName(name, '=');
    // ex : +
    if (name == '+' || name.length == 0) return "arg";
	return name;
  }
  
  function extractName(name, c) {
    var index = name.indexOf(c);
    if (index == -1) return name;
    if (index == 0) return name.substring(1, name.length);
    return name.substring(0, index);
  }
  
  var formatType = function (type, isArray, isInstance) {
    var t = "";
    if (isArray) {
      t += '[';
    }
    if (isInstance && type != 'string' && type != 'bool' && type != 'number')
      t += '+';
    t += type;
    if (isArray) {
      t += ']';
    }
    return t;
  }

  
    
});  