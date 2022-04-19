export const IN = {
  // сначала берутся параметры из группы
  group: 'in',
  // потом перезаписываются свойствами, указанными ниже (если есть)
  id: 'IN',
  attrs: {
    text: {
      text: 'ВХОД',
    },
  },
};

export const OUT = {
  id: 'OUT',
  group: 'out',
  attrs: {
    text: {
      text: 'Выход',
    },
  },
};

export const OUT2 = {
  id: 'OUT2',
  group: 'out',
  attrs: {
    text: {
      text: 'Выход 2',
    },
  },
};
// Единичный вариант для StartScenario
export const START = {
  id: 'OUT',
  group: 'out',
  attrs: {
    text: {
      text: 'Старт',
    },
  },
};

export const END = {
  z: 999,
  id: 'IN',
  group: 'in',
  attrs: {
    text: {
      text: 'Конец',
    },
  },
};
