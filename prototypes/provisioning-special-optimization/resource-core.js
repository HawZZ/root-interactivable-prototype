(function(root){
 const keys=['dynamicResource1','dynamicResource2'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 function initial(){return {A:{dynamicResource1:null,dynamicResource2:null},B:{dynamicResource1:{assetId:'B-demo-1',name:'B-purpose-1.gif',size:655360,format:'gif'},dynamicResource2:{assetId:'B-demo-2',name:'B-purpose-2.json',size:1048576,format:'json'}}};}
 function validate(file){if(!file||!Number.isFinite(file.size)||file.size<=0)return '请选择非空文件。';if(!/\.(gif|json)$/i.test(file.name||''))return '仅支持 gif / json 格式，请重新选择。';if(file.size>5*1024*1024)return '文件大小超过 5M，请重新选择。';return '';}
 function update(config,product,key,file){if(!Object.hasOwn(config,product))throw new Error('未知产品');if(!keys.includes(key))throw new Error('未知资源字段');if(file){const issue=validate(file);if(issue)throw new Error(issue);}const next=clone(config);next[product][key]=file?clone(file):null;return next;}
 root.ProductResourceCore={keys,initial,validate,update};
})(globalThis);
