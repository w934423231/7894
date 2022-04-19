import { default as joint } from "jointjs/dist/joint.js";

// Routes the link always to/from a certain side
//
// Arguments:
//   padding ... gap between the element and the first vertex. :: Default 40.
//   side ... 'left' | 'right' | 'top' | 'bottom' :: Default 'bottom'.
//
joint.routers.modifedOneSide = function(vertices, opt, linkView) {
  var side = opt.side || "bottom";
  var padding = opt.padding || 15;

  // LinkView contains cached source an target bboxes.
  // Note that those are Geometry rectangle objects.
  var sourceBBox = linkView.sourceBBox;
  var targetBBox = linkView.targetBBox;
  var sourcePoint = sourceBBox.center();
  var targetPoint = targetBBox.center();

  function getParams(side) {
    var coordinate, dimension, direction;
    switch (side) {
      case "bottom":
        direction = 1;
        coordinate = "y";
        dimension = "height";
        break;
      case "top":
        direction = -1;
        coordinate = "y";
        dimension = "height";
        break;
      case "left":
        direction = -1;
        coordinate = "x";
        dimension = "width";
        break;
      case "right":
        direction = 1;
        coordinate = "x";
        dimension = "width";
        break;
      default:
        throw new Error("Router: invalid side");
    }
    return { coordinate, dimension, direction };
  }

  // move the points from the center of the element to outside of it.
  var s = getParams("right");
  var t = getParams("left");
  sourcePoint[s.coordinate] +=
    s.direction * (sourceBBox[s.dimension] / 2 + padding);
  targetPoint[t.coordinate] +=
    t.direction * (targetBBox[t.dimension] / 2 + padding);

  // make link orthogonal (at least the first and last vertex).
  if (
    s.direction * (sourcePoint[s.coordinate] - targetPoint[t.coordinate]) >
    0
  ) {
    //targetPoint[t.coordinate] = sourcePoint[s.coordinate];
  } else {
    sourcePoint[s.coordinate] = targetPoint[t.coordinate];
  }

  return [sourcePoint].concat(vertices, targetPoint);
};
