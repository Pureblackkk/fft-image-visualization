!function(){"use strict";function t(t,n){(null==n||n>t.length)&&(n=t.length);for(var e=0,r=new Array(n);e<n;e++)r[e]=t[e];return r}function n(n,e){if(n){if("string"===typeof n)return t(n,e);var r=Object.prototype.toString.call(n).slice(8,-1);return"Object"===r&&n.constructor&&(r=n.constructor.name),"Map"===r||"Set"===r?Array.from(n):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?t(n,e):void 0}}function e(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,n){var e=null==t?null:"undefined"!==typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=e){var r,a,o=[],u=!0,i=!1;try{for(e=e.call(t);!(u=(r=e.next()).done)&&(o.push(r.value),!n||o.length!==n);u=!0);}catch(c){i=!0,a=c}finally{try{u||null==e.return||e.return()}finally{if(i)throw a}}return o}}(t,e)||n(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function r(t,n,e){return n in t?Object.defineProperty(t,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[n]=e,t}function a(t,n){return a=Object.setPrototypeOf||function(t,n){return t.__proto__=n,t},a(t,n)}function o(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function u(t,n,e){return u=o()?Reflect.construct:function(t,n,e){var r=[null];r.push.apply(r,n);var o=new(Function.bind.apply(t,r));return e&&a(o,e.prototype),o},u.apply(null,arguments)}function i(e){return function(n){if(Array.isArray(n))return t(n)}(e)||function(t){if("undefined"!==typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(e)||n(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var c=Symbol("Comlink.proxy"),l=Symbol("Comlink.endpoint"),f=Symbol("Comlink.releaseProxy"),s=Symbol("Comlink.thrown"),p=function(t){return"object"===typeof t&&null!==t||"function"===typeof t},y=new Map([["proxy",{canHandle:function(t){return p(t)&&t[c]},serialize:function(t){var n=new MessageChannel,e=n.port1,r=n.port2;return v(t,e),[r,[r]]},deserialize:function(t){return t.start(),d(t,[],n);var n}}],["throw",{canHandle:function(t){return p(t)&&s in t},serialize:function(t){var n=t.value;return[n instanceof Error?{isError:!0,value:{message:n.message,name:n.name,stack:n.stack}}:{isError:!1,value:n},[]]},deserialize:function(t){if(t.isError)throw Object.assign(new Error(t.value.message),t.value);throw t.value}}]]);function v(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:self;n.addEventListener("message",(function a(o){if(o&&o.data){var c,l=Object.assign({path:[]},o.data),f=l.id,p=l.type,y=l.path,m=(o.data.argumentList||[]).map(A);try{var d=y.slice(0,-1).reduce((function(t,n){return t[n]}),t),b=y.reduce((function(t,n){return t[n]}),t);switch(p){case"GET":c=b;break;case"SET":d[y.slice(-1)[0]]=A(o.data.value),c=!0;break;case"APPLY":c=b.apply(d,m);break;case"CONSTRUCT":var g;c=w(u(b,i(m)));break;case"ENDPOINT":var O=new MessageChannel,j=O.port1,P=O.port2;v(t,P),c=E(j,[j]);break;case"RELEASE":c=void 0;break;default:return}}catch(g){c=r({value:g},s,0)}Promise.resolve(c).catch((function(t){return r({value:t},s,0)})).then((function(t){var r=e(S(t),2),o=r[0],u=r[1];n.postMessage(Object.assign(Object.assign({},o),{id:f}),u),"RELEASE"===p&&(n.removeEventListener("message",a),h(n))}))}})),n.start&&n.start()}function h(t){(function(t){return"MessagePort"===t.constructor.name})(t)&&t.close()}function m(t){if(t)throw new Error("Proxy has been released and is not useable")}function d(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(){},a=!1,o=new Proxy(r,{get:function(e,r){if(m(a),r===f)return function(){return O(t,{type:"RELEASE",path:n.map((function(t){return t.toString()}))}).then((function(){h(t),a=!0}))};if("then"===r){if(0===n.length)return{then:function(){return o}};var u=O(t,{type:"GET",path:n.map((function(t){return t.toString()}))}).then(A);return u.then.bind(u)}return d(t,[].concat(i(n),[r]))},set:function(r,o,u){m(a);var c=e(S(u),2),l=c[0],f=c[1];return O(t,{type:"SET",path:[].concat(i(n),[o]).map((function(t){return t.toString()})),value:l},f).then(A)},apply:function(r,o,u){m(a);var i=n[n.length-1];if(i===l)return O(t,{type:"ENDPOINT"}).then(A);if("bind"===i)return d(t,n.slice(0,-1));var c=e(b(u),2),f=c[0],s=c[1];return O(t,{type:"APPLY",path:n.map((function(t){return t.toString()})),argumentList:f},s).then(A)},construct:function(r,o){m(a);var u=e(b(o),2),i=u[0],c=u[1];return O(t,{type:"CONSTRUCT",path:n.map((function(t){return t.toString()})),argumentList:i},c).then(A)}});return o}function b(t){var n,e=t.map(S);return[e.map((function(t){return t[0]})),(n=e.map((function(t){return t[1]})),Array.prototype.concat.apply([],n))]}var g=new WeakMap;function E(t,n){return g.set(t,n),t}function w(t){return Object.assign(t,r({},c,!0))}function S(t){var r,a=function(t,e){var r="undefined"!==typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!r){if(Array.isArray(t)||(r=n(t))||e&&t&&"number"===typeof t.length){r&&(t=r);var a=0,o=function(){};return{s:o,n:function(){return a>=t.length?{done:!0}:{done:!1,value:t[a++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var u,i=!0,c=!1;return{s:function(){r=r.call(t)},n:function(){var t=r.next();return i=t.done,t},e:function(t){c=!0,u=t},f:function(){try{i||null==r.return||r.return()}finally{if(c)throw u}}}}(y);try{for(a.s();!(r=a.n()).done;){var o=e(r.value,2),u=o[0],i=o[1];if(i.canHandle(t)){var c=e(i.serialize(t),2);return[{type:"HANDLER",name:u,value:c[0]},c[1]]}}}catch(l){a.e(l)}finally{a.f()}return[{type:"RAW",value:t},g.get(t)||[]]}function A(t){switch(t.type){case"HANDLER":return y.get(t.name).deserialize(t.value);case"RAW":return t.value}}function O(t,n,e){return new Promise((function(r){var a=new Array(4).fill(0).map((function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)})).join("-");t.addEventListener("message",(function n(e){e.data&&e.data.id&&e.data.id===a&&(t.removeEventListener("message",n),r(e.data))})),t.start&&t.start(),t.postMessage(Object.assign({id:a},n),e)}))}v({createImageData:function(t){if(!t)return null;var n=t.channel,e=t.width,r=t.height,a=t.alpha,o=[];n.forEach((function(t,n){o.push(t),o.push(t),o.push(t),o.push(a[n])}));var u=Uint8ClampedArray.from(o);return new ImageData(u,e,r)}})}();
//# sourceMappingURL=channel2image.worker.507b7a15.js.map