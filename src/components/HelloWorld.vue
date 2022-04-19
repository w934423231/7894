<template>
  <div class="editor">
    <div class="joint-conainer">
      <div
        style="width: 100%;height: 25px; position:fixed;background:red; top: 0; z-index: 1"
      >
        <button @click="addBlock">+</button>
        <button @click="dijkstraAll">dijkstraAll</button>
        <button @click="findCycles">findCycles</button>
      </div>
      <div id="paper"></div>
    </div>
    <div v-if="sideWindow" class="side-window">
      <button @click="sideWindow = !1;">close</button>
      {{ activeCellView.model.get('form') }}
    </div>
  </div>
</template>

<script>
import joint from 'jointjs/dist/joint.js';
import graphlib from 'graphlib';
import $ from 'jquery';
import _ from 'lodash';
import 'jointjs/dist/joint.css';
import './shapes_CustomRectangle.js';
import './router_manhattan.js';
import './router_metro.js';
import './router_avoid.js';
import './shapes_smartcalls.js';
import './connector_preventBrokenArrows.js';
import './router_replaced_orthogonal.js';

let mouseMoved = false;
// dragged? x, y
let dragStat = [false, 0, 0];

export default {
  name: 'HelloWorld',
  data() {
    return {
      graph: null,
      paper: null,
      count: 1,
      // DEBUG VARIABLE
      joint: joint,
      // все что необходимо для боковой панели
      sideWindow: false,
      activeCellView: null,
    };
  },
  methods: {
    createBlock() {
      var rect = new joint.shapes.smartcalls.ScenarioStart({ id: 'start' });
      rect.position(50, 200);
      rect.addTo(this.graph);
      var rect2 = new joint.shapes.smartcalls.CallEnd({ id: 'end' });
      rect2.position(500, 200);
      rect2.addTo(this.graph);
    },
    addBlock() {
      var rect = new joint.shapes.smartcalls.Middle({
        id: 'test-' + this.count,
      }).setText('test-' + this.count++);
      rect.position(300, 400);
      rect.addTo(this.graph);
    },
    // Нужен import graphlib from 'graphlib';
    dijkstraAll() {
      let graph = this.graph.toGraphLib(); // Преобразует в граф для GraphLib
      let test = graphlib.alg.dijkstraAll(graph, null, function(v) {
        return graph.nodeEdges(v);
      });
      console.log(test);
    },
    findCycles() {
      let graph = this.graph.toGraphLib();
      console.log('цикл: ', graphlib.alg.findCycles(graph));
    },
  },
  mounted() {
    const self = this; // для Joint, так как он меняет this;
    window.z = this; // use only CHROME console instead of sansbox console
    this.graph = new joint.dia.Graph();
    this.paper = new joint.dia.Paper({
      el: document.getElementById('paper'),
      model: this.graph,
      width: '100%',
      height: '100%',
      gridSize: 10,
      drawGrid: true,
      background: {
        color: 'rgba(0, 255, 0, 0.3)',
      },
      // Определяет ГДЕ находится точка куда будет стремиться линк, первичное приближение
      defaultAnchor: function customAnchor(
        endView,
        endMagnet,
        anchorReference,
        args,
        endType,
      ) {
        // Данная функция уточняет способы присоединения, несмотря на то, что joint волне корректно цепляет линки к центру
        // Это для пограничных случаев когда сбоит роутинг, чтобы не было присоединений к порту сверху\снизу и т.д.
        if (endType === 'source') {
          return joint.anchors.right.apply(this, arguments);
        }
        if (endType === 'target') {
          return joint.anchors.left.apply(this, arguments);
        }
        // если неведомая херня - пусть по центру отдает
        return joint.anchors.center.apply(this, arguments);
      },
      // Этим мы говорим - конечная точка для линков определяется по "точке якорения", задаваемой в defaultAcnhor
      // определяет КАК пойдет линия в эту точку, вторичное приближение
      defaultConnectionPoint: {
        name: 'anchor',
        args: {
          offset: 0,
        },
      },

      defaultConnector: {
        // TODO нужно создать типа wobble коннектора, который будет добавлять точки отступа от портов
        // это позволит избавиться от от изменения orthogonal дефолт роутера
        name: 'preventBrokenArrows',
      },
      defaultRouter: {
        // metro2 это измененный роутинг с фолбеками чтобы не проваливались внутрь стрелочки
        // там заменен fallbackRoute на modifedOneSide, который делает небольшие отступы от портов
        name: 'manhattan',
        args: {
          // аргументы для роутера. Удобно когда defaultRouter функция и можно подставлять для разных линков разные входящие аргументы
        },
      },
      // функция вызывается после завершения работы с линком. сюда будет удобно проверки на callForward, VMD и т.д поместить
      allowLink: function(linkView, paper) {
        // TODO: добавить валидаторы callforward, vmd, sts
        return true;
      },
      // перенос старых настроек. был момент что эта настройка "починила" редактор который отказывался работать с линками блоками итд якобы из-за частых нажатий мышкой
      clickThreshold: 1,
      // запрет линков, чей конец не в порту, а на бумаге
      linkPinning: false,
      // это свойство и классы .available-magnet делают подсветку куда можно добавить линк
      markAvailable: true,
      validateConnection: function(
        sourceView,
        sourceMagnet,
        targetView,
        targetMagnet,
      ) {
        // todo: ограничить разрешенные к присоединению порты, как и ранее
        // разрешено к присоединению только ВХ порты
        // ограничение для CallPSTN (ДО этого блока)
        // ограничение для VMD (после VMD)
        // итд
        try {
          if (sourceView === targetView) return false;
        } catch (err) {
          console.error('validate err', err);
          return false;
        }
        return joint.dia.Paper.prototype.options.validateConnection.apply(
          this,
          arguments,
        );
      },
      // определяет, можно ли на кликнутом порту создавать ссылку
      validateMagnet: function() {
        // дефолт поведение - на всех портах не passive можно создавать ссылку
        return joint.dia.Paper.prototype.options.validateMagnet.apply(
          this,
          arguments,
        );
      },
      // удаляется дефолтовый хайлатер, который оборачивает элемент в оранжевую рамку
      highlighting: _.merge(
        {},
        joint.dia.Paper.prototype.options.highlighting,
        { default: null },
      ),
      // притягивание линка к порту на определенном расстоянии
      snapLinks: { radius: 75 },
      // различные разрешенные действия на холсте
      interactive: function(cellView) {
        // todo действия в зависимости от Vue параметров
        return {
          // никакие действия с точками "кастомизации" линков делать нельзя
          vertexAdd: false,
          vertexMove: false,
          vertexRemove: false,
        };
      },
      defaultLink: function(cellView, magnet) {
        const linkOptions = {
          // кастомизация позволяет убрать ненужные элементы. например если нужно отключить link tools по ховеру
          markup: [
            '<path class="connection" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-source" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="marker-target" fill="black" stroke="black" d="M 0 0 0 0"/>',
            '<path class="connection-wrap" d="M 0 0 0 0"/>',
            '<g class="marker-arrowheads"/>',
            '<g class="link-tools"/>',
          ].join(''),
          // маркер управления source/target скопирован с исходного
          arrowheadMarkup: [
            '<g class="marker-arrowhead-group marker-arrowhead-group-<%= end %>">',
            '<path class="marker-arrowhead" end="<%= end %>" d="M 26 0 L 0 13 L 26 26 z" />',
            '</g>',
          ].join(''),
          // различные инструменты работы с линком. почему-то кроме удаление ничего не отображается
          toolMarkup: [
            '<g class="link-tool">',
            '<g class="tool-remove" event="remove">',
            '<circle r="11" />',
            '<path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z" />',
            // '<title>Remove link.</title>',
            '</g>',
            '<g class="tool-options1" event="link:options:pointerclick">',
            '<circle r="11" transform="translate(25)"/>',
            '<path fill="white" transform="scale(.55) translate(29, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
            '<title>Link options.</title>',
            '</g>',
            '</g>',
          ].join(''),
        };
        var link = new (joint.dia.Link.extend(linkOptions))();
        // кастомизация стандартного линка
        link.attr({
          // на конце - стрелочка
          '.marker-target': {
            d: 'M -2 -5 -10 0 -2 5',
            fill: 'black',
            stroke: '#сссссс',
          },
          // не отображать большой треугольник перемещения sourse
          '.marker-arrowhead[end="source"]': { display: 'none' },
          // а для target наоборот отражать
          '.marker-arrowhead[end="target"]': {
            d: 'M 26 0 L 0 13 L 26 26 z',
          },
        });
        // можно изучить как wobble оперирует с роутингом и сделать свой, чтобы последний сегмент отделяло от стрелочки
        // link.connector('wobble', {
        //   spread: 10,
        // });
        // link.set('router', );
        return link;
      },
      // LinkView  с различными тулзами
      linkView: function() {
        // TODO переделать на объект или понять - нужно ли сюда чтото еще добавить
        const view = joint.dia.LinkView.extend({
          options: joint.util.merge({}, joint.dia.LinkView.prototype.options, {
            doubleLinkTools: false,
          }),
        });
        return view;
      },
    });
    //alert('заставить link:options реагировать');
    this.graph.on('link:options:pointerclick', function() {
      console.log(arguments);
    });
    // функция отслеживающая добавление чего-либо в модель диаграммы
    this.graph.on('add', function(newCell) {
      if (newCell.isLink && newCell.isLink()) {
        // тут я отслеживаю добавлен линк и привязываю свои linkTools на него
        // возможно эта функция будет убрана, так как доработан defaultLink
        const linkView = newCell.findView(self.paper);
        // пока отключим данный код
        if (linkView && linkView.hasTools() === false && false) {
          // boundaryTool для отладки - видеть размеры линка
          // var boundaryTool = new joint.linkTools.Boundary();
          // решил что кнопку "удалить" я рисую всегда. Возможно потом от этого откажусь
          var removeButton = new joint.linkTools.Remove({
            distance: 10,
          });

          var toolsView = new joint.dia.ToolsView({
            tools: [removeButton],
          });
          // linkView.addTools(toolsView);
        }
      }
    });
    // немного костылей, чтобы после mousemove не открывалось боковое окно
    this.paper.on('element:pointerdown', function() {
      mouseMoved = false;
    });
    this.paper.on('element:pointermove', function() {
      mouseMoved = true;
    });
    this.paper.on('element:pointerclick', function(cellView, event, x, y) {
      if (mouseMoved === false) {
        self.activeCellView = cellView;
        self.sideWindow = true;
      }
    });
    // обработка draggable для холста
    this.paper.on('blank:pointerdown', function(evt) {
      dragStat = [true, evt.clientX, evt.clientY];
    });
    this.paper.on('blank:pointerup', function(evt) {
      dragStat = [false, 0, 0];
    });
    this.paper.on('blank:pointermove', function(event) {
      if (dragStat[0] === true) {
        const { tx, ty } = self.paper.translate();
        const [dx, dy] = [
          event.clientX - dragStat[1],
          event.clientY - dragStat[2],
        ];
        self.paper.translate(tx + dx, ty + dy);
        dragStat = [true, event.clientX, event.clientY];
      }
    });
    this.paper.on('cell:mousewheel blank:mousewheel', function() {
      // 4 - на пустом месте, 5 на блоке
      const [cellView, evt, x, y, delta] =
        arguments.length === 5
          ? Array.prototype.slice.apply(arguments, [0])
          : [null, ...Array.prototype.slice.apply(arguments, [0])];

      var currentScale = self.paper.scale().sx;
      var newScale = currentScale + delta * 0.02;
      self.paper.scale(newScale);
    });

    this.paper.on('cell:pointerdblclick', function(cellView, event, x, y) {
      // DEBUG FX
      window.x = cellView;
      if (cellView.model.isElement() === true) {
        cellView.model.addPort({ group: 'out' });
      } else {
        console.warn('это линк, на него нельзя добавлять порты');
      }
    });
    this.paper.on('element:remove_button:pointerdown', function(
      elementView,
      evt,
    ) {
      // todo исправить на нормальное окошечко
      evt.stopPropagation();
      // eslint-disable-next-line
      var answer = !!confirm('Удалить?');
      if (answer) elementView.model.remove();
      // debugger;
    });
    this.graph.on('change:position', function(cell) {
      const center = cell.getBBox().center();
      cell.attr('label/text', center.toString());
    });

    this.createBlock();
  },
};
</script>

<style lang="postcss">
.available-magnet {
  fill: red;
  stroke: red;
}
.side-window {
  position: absolute;
  width: 500px;
  right: 0;
  top: 0;
  z-index: 10;
  background-color: #fff;
  /*box-shadow: -5px 0 25px 0px rgba(0, 0, 0, 0.6);*/
  height: 100%;
  overflow: hidden;
}
</style>
