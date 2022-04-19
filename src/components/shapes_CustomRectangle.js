import joint from 'jointjs/dist/joint.js';

joint.shapes.standard.Rectangle.define(
  'examples.CustomRectangle',
  {
    attrs: {
      body: {
        rx: 10,
        ry: 10,
        strokeWidth: 1,
        fill: 'aliceblue',
      },
      label: {
        textAnchor: 'left',
        refX: 10,
        fill: 'white',
      },
    },
  },
  {
    // inherit joint.shapes.standard.Rectangle.markup
  },
  {
    createRandom: function() {
      const rectangle = new joint.shapes.examples.CustomRectangle();
      var fill =
        '#' +
        ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(
          -6,
        );
      var stroke =
        '#' +
        ('000000' + Math.floor(Math.random() * 16777215).toString(16)).slice(
          -6,
        );
      var strokeWidth = Math.floor(Math.random() * 6);
      var strokeDasharray =
        Math.floor(Math.random() * 6) + ' ' + Math.floor(Math.random() * 6);
      var radius = Math.floor(Math.random() * 21);

      rectangle.attr({
        body: {
          fill: fill,
          stroke: stroke,
          strokeWidth: strokeWidth,
          strokeDasharray: strokeDasharray,
          rx: radius,
          ry: radius,
        },
        label: {
          // ensure visibility on dark backgrounds
          fill: 'black',
          stroke: 'white',
          strokeWidth: 1,
        },
      });

      return rectangle;
    },
  },
);
