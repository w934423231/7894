import joint from 'jointjs/dist/joint.js';
import _ from 'lodash';
const g = joint.g;

joint.connectors.preventBrokenArrows = function(
  sourcePoint,
  targetPoint,
  vertices,
  args,
) {
  var path = joint.connectors.normal.apply(this, arguments);
  // debugger;
  return path;
};
