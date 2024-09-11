import { Unsafe } from 'rf-unsafe';

const unsafe = new Unsafe;
unsafe.options.safe = true;
unsafe.options.timeout = 500;

const cond = 'object01.property01 == "value"';
const data = {
  object01: {
    property01: 'value',
  },
};

await unsafe.exec(cond, data);