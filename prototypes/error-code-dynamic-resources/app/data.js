export const LANGUAGES=[['en','英语（默认）'],['zh','中文'],['de','德语'],['fr','法语'],['zh-Hant','繁体中文'],['it','意大利语'],['pt','葡萄牙语'],['es','西班牙语'],['ar','阿拉伯语'],['vi','越南语'],['id','印尼语'],['th','泰语'],['ms','马来语'],['ja','日语'],['ru','俄语'],['fil','菲律宾语']];
export const SOURCES=[{vendor:'ROOT',sdk:'root-provisioning',label:'ROOT · root-provisioning'},{vendor:'涂鸦',sdk:'thing-activator',label:'涂鸦 · thing-activator'},{vendor:'觅睿',sdk:'ray-pairing',label:'觅睿 · ray-pairing'}];
const block=(id,order,primary,secondary,prefixType='number',icon='')=>({id,order,prefixType,icon,number:prefixType==='number'?String(order):'',primary,secondary});
const content=(title,summary,blocks)=>({title,summary,blocks});
const code=(description,content)=>({description,content,updated:'2026-10-14 10:00'});
export function initialState(){return {schema:3,version:1,codes:{
 PROVISION_NETWORK_TIMEOUT:code('设备连接网络超时',{
  en:content('Unable to connect','The network connection timed out. Try these steps.',[
   block('step1',1,'Check your **Wi-Fi connection**','Use a 2.4 GHz Wi-Fi network.\nKeep your phone close to the device.','icon','wifi'),
   block('step2',2,'Try connecting again','Restart the device and repeat the pairing steps.')]),
  zh:content('设备连接失败','连接网络超时，请按以下步骤检查后重试。',[
   block('step1',1,'检查 **Wi-Fi 网络**','请使用 2.4GHz Wi-Fi。\n确保手机靠近设备。','icon','wifi'),
   block('step2',2,'重新连接设备','重启设备后，再次按配网步骤操作。')]),
  de:content('Verbindung fehlgeschlagen','Die Netzwerkverbindung ist abgelaufen.',[block('step1',1,'**WLAN prüfen**','Verwenden Sie ein 2,4-GHz-Netzwerk.','icon','wifi')])}),
 PROVISION_AUTH_FAILED:code('设备认证未通过',{
  en:content('Verification failed','We could not verify the device.',[block('step1',1,'Try again','Restart the device and retry pairing.'),block('step2',2,'Contact support','If the problem continues, contact **customer support**.')]),
  zh:content('设备认证失败','暂时无法完成设备认证。',[block('step1',1,'再次尝试','重启设备后重新配网。'),block('step2',2,'联系客服','如问题仍未解决，请联系 **客服**。')])}),
 PROVISION_DEVICE_ALREADY_BOUND:code('设备已被其他账号绑定',{
  en:content('Device already linked','This device is linked to another account.',[block('step1',1,'Contact support','Contact customer support for assistance.','icon','info')]),
  zh:content('设备已绑定','此设备已被其他账号绑定。',[block('step1',1,'联系客服','请联系客服协助处理。','icon','info')])}),
 PROVISION_BLUETOOTH_UNAVAILABLE:code('蓝牙连接不可用',{
  en:content('Bluetooth unavailable','Check your Bluetooth settings.',[block('step1',1,'Turn on **Bluetooth**','Enable Bluetooth and allow the app to use it.','icon','bluetooth')]),
  zh:content('蓝牙连接不可用','请检查手机蓝牙设置。',[block('step1',1,'开启 **蓝牙**','开启手机蓝牙，并允许 APP 使用蓝牙。','icon','bluetooth')])}),
 PROVISION_TOKEN_UNAVAILABLE:code('配网凭证获取失败',{}),
 PROVISION_UNKNOWN:code('未识别的配网错误',{
  en:content('Unable to connect','The device could not connect.',[block('step1',1,'Try again','Wait a moment and repeat the pairing steps.')]),
  zh:content('设备连接失败','暂时无法连接设备。',[block('step1',1,'稍后重试','请稍后重新按配网步骤操作。')])})
 },mappings:[
  {vendor:'ROOT',sdk:'root-provisioning',reasonType:'number',reason:1006,normalizedCode:'PROVISION_NETWORK_TIMEOUT'},
  {vendor:'ROOT',sdk:'root-provisioning',reasonType:'string',reason:'AUTH_FAILED',normalizedCode:'PROVISION_AUTH_FAILED'},
  {vendor:'ROOT',sdk:'root-provisioning',reasonType:'string',reason:'DEVICE_BOUND',normalizedCode:'PROVISION_DEVICE_ALREADY_BOUND'},
  {vendor:'ROOT',sdk:'root-provisioning',reasonType:'string',reason:'BLE_UNAVAILABLE',normalizedCode:'PROVISION_BLUETOOTH_UNAVAILABLE'},
  {vendor:'ROOT',sdk:'root-provisioning',reasonType:'string',reason:'TOKEN_EMPTY',normalizedCode:'PROVISION_TOKEN_UNAVAILABLE'},
  {vendor:'涂鸦',sdk:'thing-activator',reasonType:'number',reason:1006,normalizedCode:'PROVISION_AUTH_FAILED'},
  {vendor:'涂鸦',sdk:'thing-activator',reasonType:'string',reason:'PAIR_TIMEOUT',normalizedCode:'PROVISION_NETWORK_TIMEOUT'},
  {vendor:'觅睿',sdk:'ray-pairing',reasonType:'string',reason:'PAIR_TIMEOUT',normalizedCode:'PROVISION_NETWORK_TIMEOUT'}
 ],lastChange:'初始化演示配置',updated:'2026-10-14 10:00'};}
export function sampleRows(kind='normal'){
 if(kind==='conflict')return [
  {reasonType:'string',reason:'NEW_REASON',normalizedCode:'PROVISION_AUTH_FAILED',description:'设备认证未通过'},
  {reasonType:'number',reason:1006,normalizedCode:'PROVISION_NETWORK_TIMEOUT',description:'设备连接网络超时'},
  {reasonType:'number',reason:1006,normalizedCode:'PROVISION_AUTH_FAILED',description:'设备认证未通过'}
 ];
 return [
  {reasonType:'string',reason:'WIFI_PASSWORD_WRONG',normalizedCode:'PROVISION_WIFI_PASSWORD_INVALID',description:'Wi-Fi 密码校验失败'},
  {reasonType:'number',reason:1006,normalizedCode:'PROVISION_NETWORK_UNREACHABLE',description:'设备无法访问目标网络'},
  {reasonType:'string',reason:'AUTH_FAILED',normalizedCode:'PROVISION_AUTH_FAILED',description:'设备认证未通过'}
 ];
}
export const STORAGE_KEY='iot-error-resource-prototype-v1';
