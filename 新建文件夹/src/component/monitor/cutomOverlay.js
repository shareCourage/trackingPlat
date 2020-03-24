const ComplexCustomOverlay= function(point, text){
  this._point = point;
  this._text = text;
}
ComplexCustomOverlay.prototype = new window.BMap.Overlay();
ComplexCustomOverlay.prototype.initialize = function(map){
  this._map = map;
  var div = this._div = document.createElement("div");
  div.style.position = "absolute";
  div.style.zIndex = window.BMap.Overlay.getZIndex(this._point.lat);
  div.style.backgroundColor = "#EE5D5B";
  div.style.border = "1px solid #BC3B3A";
  div.style.color = "white";
  div.style.height = "125px";
  div.style.padding = "2px";
  div.style.lineHeight = "18px";
  div.style.whiteSpace = "nowrap";
  div.style.MozUserSelect = "none";
  div.style.fontSize = "12px"
  div.innerHTML = this._text;
  var that = this;

  var arrow = this._arrow = document.createElement("div");
  arrow.style.background = "url(//map.baidu.com/fwmap/upload/r/map/fwmap/static/house/images/label.png) no-repeat";
  arrow.style.position = "absolute";
  arrow.style.width = "11px";
  arrow.style.height = "10px";
  arrow.style.top = "22px";
  arrow.style.left = "10px";
  arrow.style.overflow = "hidden";
  div.appendChild(arrow);
 
  map.getPanes().labelPane.appendChild(div);
  
  return div;
};
ComplexCustomOverlay.prototype.draw = function(){
  var map = this._map;
  var pixel = map.pointToOverlayPixel(this._point);
  this._div.style.left = pixel.x - parseInt(this._arrow.style.left) + "px";
  this._div.style.top  = pixel.y - 30 + "px";
}

export default ComplexCustomOverlay