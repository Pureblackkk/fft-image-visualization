!function(){"use strict";function t(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function e(e,r){if(e){if("string"===typeof e)return t(e,r);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?t(e,r):void 0}}function r(t,r){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){var r=null==t?null:"undefined"!==typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,a,i=[],o=!0,l=!1;try{for(r=r.call(t);!(o=(n=r.next()).done)&&(i.push(n.value),!e||i.length!==e);o=!0);}catch(u){l=!0,a=u}finally{try{o||null==r.return||r.return()}finally{if(l)throw a}}return i}}(t,r)||e(t,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function n(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function a(t,e){return a=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t},a(t,e)}function i(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}function o(t,e,r){return o=i()?Reflect.construct:function(t,e,r){var n=[null];n.push.apply(n,e);var i=new(Function.bind.apply(t,n));return r&&a(i,r.prototype),i},o.apply(null,arguments)}function l(r){return function(e){if(Array.isArray(e))return t(e)}(r)||function(t){if("undefined"!==typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(r)||e(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var u=Symbol("Comlink.proxy"),s=Symbol("Comlink.endpoint"),c=Symbol("Comlink.releaseProxy"),f=Symbol("Comlink.thrown"),h=function(t){return"object"===typeof t&&null!==t||"function"===typeof t},v=new Map([["proxy",{canHandle:function(t){return h(t)&&t[u]},serialize:function(t){var e=new MessageChannel,r=e.port1,n=e.port2;return y(t,r),[n,[n]]},deserialize:function(t){return t.start(),d(t,[],e);var e}}],["throw",{canHandle:function(t){return h(t)&&f in t},serialize:function(t){var e=t.value;return[e instanceof Error?{isError:!0,value:{message:e.message,name:e.name,stack:e.stack}}:{isError:!1,value:e},[]]},deserialize:function(t){if(t.isError)throw Object.assign(new Error(t.value.message),t.value);throw t.value}}]]);function y(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:self;e.addEventListener("message",(function a(i){if(i&&i.data){var u,s=Object.assign({path:[]},i.data),c=s.id,h=s.type,v=s.path,m=(i.data.argumentList||[]).map(E);try{var d=v.slice(0,-1).reduce((function(t,e){return t[e]}),t),b=v.reduce((function(t,e){return t[e]}),t);switch(h){case"GET":u=b;break;case"SET":d[v.slice(-1)[0]]=E(i.data.value),u=!0;break;case"APPLY":u=b.apply(d,m);break;case"CONSTRUCT":var g;u=T(o(b,l(m)));break;case"ENDPOINT":var L=new MessageChannel,S=L.port1,M=L.port2;y(t,M),u=w(S,[S]);break;case"RELEASE":u=void 0;break;default:return}}catch(g){u=n({value:g},f,0)}Promise.resolve(u).catch((function(t){return n({value:t},f,0)})).then((function(t){var n=r(A(t),2),i=n[0],o=n[1];e.postMessage(Object.assign(Object.assign({},i),{id:c}),o),"RELEASE"===h&&(e.removeEventListener("message",a),p(e))}))}})),e.start&&e.start()}function p(t){(function(t){return"MessagePort"===t.constructor.name})(t)&&t.close()}function m(t){if(t)throw new Error("Proxy has been released and is not useable")}function d(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(){},a=!1,i=new Proxy(n,{get:function(r,n){if(m(a),n===c)return function(){return L(t,{type:"RELEASE",path:e.map((function(t){return t.toString()}))}).then((function(){p(t),a=!0}))};if("then"===n){if(0===e.length)return{then:function(){return i}};var o=L(t,{type:"GET",path:e.map((function(t){return t.toString()}))}).then(E);return o.then.bind(o)}return d(t,[].concat(l(e),[n]))},set:function(n,i,o){m(a);var u=r(A(o),2),s=u[0],c=u[1];return L(t,{type:"SET",path:[].concat(l(e),[i]).map((function(t){return t.toString()})),value:s},c).then(E)},apply:function(n,i,o){m(a);var l=e[e.length-1];if(l===s)return L(t,{type:"ENDPOINT"}).then(E);if("bind"===l)return d(t,e.slice(0,-1));var u=r(b(o),2),c=u[0],f=u[1];return L(t,{type:"APPLY",path:e.map((function(t){return t.toString()})),argumentList:c},f).then(E)},construct:function(n,i){m(a);var o=r(b(i),2),l=o[0],u=o[1];return L(t,{type:"CONSTRUCT",path:e.map((function(t){return t.toString()})),argumentList:l},u).then(E)}});return i}function b(t){var e,r=t.map(A);return[r.map((function(t){return t[0]})),(e=r.map((function(t){return t[1]})),Array.prototype.concat.apply([],e))]}var g=new WeakMap;function w(t,e){return g.set(t,e),t}function T(t){return Object.assign(t,n({},u,!0))}function A(t){var n,a=function(t,r){var n="undefined"!==typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=e(t))||r&&t&&"number"===typeof t.length){n&&(t=n);var a=0,i=function(){};return{s:i,n:function(){return a>=t.length?{done:!0}:{done:!1,value:t[a++]}},e:function(t){throw t},f:i}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var o,l=!0,u=!1;return{s:function(){n=n.call(t)},n:function(){var t=n.next();return l=t.done,t},e:function(t){u=!0,o=t},f:function(){try{l||null==n.return||n.return()}finally{if(u)throw o}}}}(v);try{for(a.s();!(n=a.n()).done;){var i=r(n.value,2),o=i[0],l=i[1];if(l.canHandle(t)){var u=r(l.serialize(t),2);return[{type:"HANDLER",name:o,value:u[0]},u[1]]}}}catch(s){a.e(s)}finally{a.f()}return[{type:"RAW",value:t},g.get(t)||[]]}function E(t){switch(t.type){case"HANDLER":return v.get(t.name).deserialize(t.value);case"RAW":return t.value}}function L(t,e,r){return new Promise((function(n){var a=new Array(4).fill(0).map((function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)})).join("-");t.addEventListener("message",(function e(r){r.data&&r.data.id&&r.data.id===a&&(t.removeEventListener("message",e),n(r.data))})),t.start&&t.start(),t.postMessage(Object.assign({id:a},e),r)}))}function S(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}var M=function(){function t(e){if(function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.dataLen=void 0,this.reverseTable=void 0,this.sinTable=void 0,this.cosTable=void 0,this.real=void 0,this.imag=void 0,this.dataLen=e,this.reverseTable=this.constructReverseTable(e),null===this.reverseTable)this.sinTable=null,this.cosTable=null,this.real=null,this.imag=null;else{var r=this.constructSinCosTable(e);this.sinTable=r[0],this.cosTable=r[1],this.real=new Float64Array(e),this.imag=new Float64Array(e)}}var e,r,n;return e=t,r=[{key:"constructReverseTable",value:function(t){var e=Math.floor(Math.log2(t));if(Math.pow(2,e)!==t)return null;for(var r=new Uint32Array(t),n=1,a=t>>1;n<t;){for(var i=0;i<n;i++)r[i+n]=r[i]+a;n<<=1,a>>=1}return r}},{key:"constructSinCosTable",value:function(t){for(var e=new Float64Array(t),r=new Float64Array(t),n=0;n<t;n++)e[n]=Math.sin(-Math.PI/n),r[n]=Math.cos(-Math.PI/n);return[e,r]}},{key:"calculation",value:function(t){if(null!=this.reverseTable&&t.length===this.dataLen&&null!=this.real&&null!=this.imag&&null!=this.cosTable&&null!=this.sinTable){for(var e=0;e<this.dataLen;e++)this.real[e]=t[this.reverseTable[e]][0],this.imag[e]=t[this.reverseTable[e]][1];for(var r,n,a,i,o,l,u,s,c=1;c<this.dataLen;){r=this.cosTable[c],n=this.sinTable[c],a=1,i=0;for(var f=0;f<c;f++){for(var h=f;h<this.dataLen;)o=h+c,l=a*this.real[o]-i*this.imag[o],u=a*this.imag[o]+i*this.real[o],this.real[o]=this.real[h]-l,this.imag[o]=this.imag[h]-u,this.real[h]+=l,this.imag[h]+=u,h+=c<<1;a=(s=a)*r-i*n,i=s*n+i*r}c<<=1}}}},{key:"reverse",value:function(t){if(null!=this.reverseTable&&null!=this.cosTable&&null!=this.sinTable&&null!=this.real&&null!=this.imag){if(t.length!==this.dataLen)throw new Error("Size not match");for(var e=0;e<this.dataLen;e++)this.real[e]=t[e][0],this.imag[e]=-1*t[e][1];for(var r=new Float64Array(this.dataLen),n=new Float64Array(this.dataLen),a=0;a<this.dataLen;a++)r[a]=this.real[this.reverseTable[a]],n[a]=this.imag[this.reverseTable[a]];this.real=r,this.imag=n;for(var i,o,l,u,s,c,f,h,v=1;v<this.dataLen;){i=this.cosTable[v],o=this.sinTable[v],l=1,u=0;for(var y=0;y<v;y++){for(var p=y;p<this.dataLen;)s=p+v,c=l*this.real[s]-u*this.imag[s],f=l*this.imag[s]+u*this.real[s],this.real[s]=this.real[p]-c,this.imag[s]=this.imag[p]-f,this.real[p]+=c,this.imag[p]+=f,p+=v<<1;l=(h=l)*i-u*o,u=h*o+u*i}v<<=1}}}},{key:"getSpectrum",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(null==this.real||null==this.imag)return null;for(var e=this.dataLen,r=[],n=0;n<e;n++)r.push([this.real[n],this.imag[n]]);if(!t)return r;for(var a=[],i=0;i<e;i++)a.push(Math.log(Math.sqrt(Math.pow(this.real[i],2)+Math.pow(this.imag[i],2))+1));return{magnitude:a,spaceMap:r}}},{key:"getReverseData",value:function(){var t=arguments.length>0&&void 0!==arguments[0]&&arguments[0];if(null==this.real||null==this.imag)return null;if(t){for(var e=new Float64Array(this.dataLen),r=0;r<this.dataLen;r++)e[r]=this.real[r]/this.dataLen;return e}for(var n=new Array(this.dataLen).fill(null).map((function(){return new Array(2)})),a=0;a<this.dataLen;a++)n[a][0]=this.real[a]/this.dataLen,n[a][1]=this.imag[a]/this.dataLen;return n}}],r&&S(e.prototype,r),n&&S(e,n),Object.defineProperty(e,"prototype",{writable:!1}),t}();y({channelInverseFFT:function(t,e,r){if(null===t)return[];for(var n=Array(e*r),a=new M(e),i=new M(r),o=new Array(r).fill(null).map((function(){return new Array(e).fill(null).map((function(){return new Array(2)}))})),l=function(n){for(var a=new Array(r),l=0,u=n;u<t.length;u+=e)a[l]=t[u],l+=1;i.reverse(a);var s=i.getReverseData(!1);if(null==s)return{v:[]};o.forEach((function(t,e){t[n][0]=s[e][0],t[n][1]=s[e][1]}))},u=0;u<e;u++){var s=l(u);if("object"===typeof s)return s.v}for(var c=function(t){var r=o[t];a.reverse(r);var i=a.getReverseData(!0);if(null==i)return{v:[]};i.forEach((function(r,a){n[(t+1)*e-a-1]=r}))},f=0;f<r;f++){var h=c(f);if("object"===typeof h)return h.v}return n}})}();
//# sourceMappingURL=fftInverse.worker.36c0ed8b.js.map