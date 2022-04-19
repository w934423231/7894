import joint from 'jointjs/dist/joint.js';
import _ from 'lodash';
import * as PORTS from './portFabric.js';

// Этот блок содержит базовую логику и шаблон отрисовки
joint.shapes.standard.Rectangle.define(
  'smartcalls.EmptyBlock',
  {
    // эта часть для SC редактора
    form: null,
    block_type: 'EmptyBlock',
    // версия блока. для преобразования старых блоков в новые
    version: 0,
    // default instance props
    size: {
      width: 200,
      height: 100,
    },
    attrs: {
      // запрещает цеплять линк к целому блоку
      '.': { magnet: false },
      body: {
        refWidth: '100%',
        refHeight: '100%',
        strokeWidth: 0,
        fill: 'white',
        // filter: {
        // name: 'dropShadow',
        // args: { dx: 0, dy: 2, blur: 28, color: '#000', opacity: 0.15 },
        // }, // Такую тень я вижу!
      },
      label: {
        ref: 'icon',
        textVerticalAnchor: 'middle',
        textAnchor: 'start',
        refX: '110%',
        // refY: "50%",
        // refDx: 0,
        fontSize: 13,
        fill: 'white',
        text: 'UNSET_LABEL',
        // 'ref-y': 6,
        // 'ref-x': 35,
        'font-family': '"lato",sans-serif',
        'font-size': '13',
        'font-weight': 800,
      },
      header: {
        refWidth: '100%',
        height: '25',
        strokeWidth: 0,
        stroke: '#9013fe',
        fill: '#9013fe',
      },
      icon: {
        ref: 'header',
        refX: 5,
        width: 25,
        height: 25,
        'xlink:href': '',
      },
      remove_area: {
        // не понимаю откуда это и почему в документации крайне мало информации
        event: 'element:remove_button:pointerdown',
        cursor: 'pointer',
        ref: 'body',
        height: '25',
        width: '25',
        fill: 'rgba(255,255,255,0.5)',
        refDx: -25,
      },
      remove_button: {
        pointerEvents: 'none',
        ref: 'body',
        stroke: 'white',
        strokeLinecap: 'round',
        strokeWidth: 3,
        refDx: -27,
        refY: -2,
        // refY: 0.01,
        d: 'M 10,10 L 20,20 M 20,10 L 10,20',
      },
    },
    ports: {
      // пустой блок не имеет выходов
      items: [],
      groups: {
        in: {
          position: {
            // задавать позицию можно predefined наборами или функцией. Для ВХ портов положение всегда одинаково - поэтому задаем его вручную
            name: 'manual',
            args: {
              x: 0,
              y: 35,
              angle: 0,
              attrs: {},
            },
          },
          label: {
            position: {
              name: 'right',
              args: { y: 8 }, // extra arguments for the label layout function, see `layout.PortLabel` section
            },
            markup: '<text class="label-text" fill="green"/>',
          },
          // magnet = passive позволяет воткнуть линк, но не позволяет его начать
          attrs: { text: { text: 'UNSET_IN' }, rect: { magnet: 'passive' } },
          markup:
            '<rect width="16" height="16" x="-8" strokegit ="red" fill="gray"/>',
        },
        out: {
          // нужно описать port.layoyt функцию
          // position: { name: "right" },
          // todo переделать на выстраивание друг за другом
          // todo и не забыть раскукоживать размеры блока (смотреть как сделано)
          // или придумать свою реализацию
          position: function(ports, elBBox, opt) {
            const positionArray = _.map(ports, function(port, index) {
              var step = 25;

              var y = Math.abs(index * step) + 40;
              const a = joint.g.point({ x: elBBox.width, y: y });
              return a;
            });
            return positionArray;
          },
          label: {
            position: {
              name: 'left',
              args: { y: 8 }, // extra arguments for the label layout function, see `layout.PortLabel` section
            },
            markup: '<text class="label-text" fill="blue"/>',
          },
          attrs: {
            text: { text: 'UNSET_OUT' },
            rect: { magnet: true },
          },
          z: 10,
          markup:
            '<rect width="16" height="16" x="-8" strokegit ="green" fill="lightgray"/>',
        },
      },
    },
  },
  {
    // prototype props
    markup: [
      {
        tagName: 'rect',
        selector: 'body',
      },
      {
        tagName: 'rect',
        selector: 'header',
      },
      {
        tagName: 'rect',
        selector: 'remove_area',
      },
      {
        tagName: 'path',
        selector: 'remove_button',
      },
      {
        tagName: 'text',
        selector: 'label',
      },
      {
        tagName: 'image',
        selector: 'icon',
      },
    ],
    initialize: function(attributes, options) {
      // Инициализация блока - удобно при graph.fromJSON понимать - нужно ли "допилить" чтото в блоке
      // например добавить в модель переменных ?
      const currentVersion = this.get('version');
      const lastVersion = joint.util.result(this, 'defaults').version;

      if (currentVersion < lastVersion) {
        this.runLegacyUpdate();
      }
      this.on('change:ports', this.fitHeight, this);
      joint.shapes.standard.Rectangle.prototype.initialize.apply(
        this,
        arguments,
      );
    },
    runLegacyUpdate() {
      // в каждом блоке нужно будет писать свой обновлятор блока под новую функцию
      console.warn(
        `Загружена более старая версия блока ${this.get(
          'type',
        )}, чем актуальная`,
      );
    },
    fitHeight(cell) {
      var defaultHeight = joint.util.result(this, 'defaults').size.height;
      var newHeight = defaultHeight;
      var outCount = cell.getPorts().filter(p => p.group === 'out').length;
      if (outCount > 2) {
        // высота порта - Разница между началом порта 1 и порта 2
        // getPortsPosition есть объект. Превращаем в отсортированую коллецию чтобы меньше кода по поиску координат портов делать
        var portPos = _.sortBy(cell.getPortsPositions('out'), 'y');
        var portHeight = portPos[1].y - portPos[0].y;
        // более 2 портов - нужно делать высоту 100 + portHeight * count OUT ports
        // в Default.width умещается 2 порта. значит измеряем без них
        newHeight = defaultHeight + portHeight * (outCount - 2);
      }
      var oldSize = cell.size();
      cell.size(oldSize.width, newHeight);
    },
  },
  {
    // static methods
  },
);
// Описание уже отдельных блоков с портами
joint.shapes.smartcalls.EmptyBlock.define(
  'smartcalls.ScenarioStart',
  {
    form: {
      startParam1: true,
      startParam2: false,
    },
    ports: {
      items: [PORTS.START],
    },
    attrs: {
      remove_area: {
        display: 'none',
      },
      remove_button: {
        display: 'none',
      },
      label: {
        text: 'Старт сценария',
      },
      icon: {
        'xlink:href':
          'https://smartcalls.io/static/editor-icon/ScenarioStart_wht.svg',
      },
    },
  },
  {},
  {},
);

joint.shapes.smartcalls.EmptyBlock.define(
  'smartcalls.CallEnd',
  {
    ports: {
      items: [PORTS.END],
    },
    attrs: {
      label: {
        text: 'Конец сценария',
      },
      icon: {
        'xlink:href':
          'https://smartcalls.io/static/editor-icon/CallEnd_wht.svg',
      },
    },
  },
  {},
  {},
);

joint.shapes.smartcalls.EmptyBlock.define(
  'smartcalls.Middle',
  {
    ports: {
      items: [PORTS.IN, PORTS.OUT, PORTS.OUT2],
    },
    attrs: {
      label: {
        text: 'Сквозной блок',
      },
      icon: {
        'xlink:href': 'https://static.thenounproject.com/png/136928-200.png',
      },
    },
  },
  {
    setText(text) {
      return this.attr('label/text', text || '');
    },
  },
  {},
);
