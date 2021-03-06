/**
 * 统一处理日期或格式化输出
 * Author: Tyler.Chao
 * github: https://github.com/cz848/dateio
 */

// 位数不够前补0，为了更好的兼容，用slice替代padStart
const zeroFill = (number, targetLength) => `00${number}`.slice(-targetLength || -2);

// 首字母大写
const capitalize = string => string.replace(/^[a-z]/, a => a.toUpperCase());

// 有非数值型参数
const isDefined = args => !args.some(n => [null, undefined].includes(n));

// 匹配不同方法的正则
const formatsRegExp = /MS|ms|[YMDWHISAUymdwhisau]/g;
const getUnitRegExp = /^(?:MS|ms|[YMDWHISAUymdwhisau])$/;
const setUnitRegExp = /^(?:ms|[Uymdhisu])$/;
const addUnitRegExp = /^([+-]?(?:\d*\.)?\d+)(ms|[ymdwhis])?$/;
// 每个时间单位对应的毫秒数或月数
const unitStep = {
  ms: 1,
  s: 1e3,
  i: 6e4,
  h: 36e5,
  d: 864e5,
  w: 864e5 * 7,
  m: 1,
  y: 12,
};
// 语言包
let I18N = {
  weekdays: ['日', '一', '二', '三', '四', '五', '六'],
  // 默认四个时段，可根据需要增减
  interval: ['凌晨', '上午', '下午', '晚上'],
};

// 设置语言包
const locale = config => {
  I18N = { ...I18N, ...config };
  return I18N;
};

// from moment.js in order to keep the same result
const monthDiff = (a, b) => {
  const wholeMonthDiff = (b.y() - a.y()) * 12 + (b.m() - a.m());
  const anchor = a.clone().add(wholeMonthDiff, 'm');
  const anchor2 = a.clone().add(wholeMonthDiff + (b > anchor ? 1 : -1), 'm');
  return -(wholeMonthDiff + (b - anchor) / Math.abs(anchor2 - anchor)) || 0;
};

// 转换为可识别的日期格式
const toDate = input => {
  if (!(input || input === 0)) return new Date();
  if (typeof input === 'string' && !/Z$/i.test(input)) return new Date(input.replace(/-/g, '/'));
  // TODO: 与原生行为有出入
  if (Array.isArray(input) && input.length !== 1) return new Date(...input);
  return new Date(input);
};

// 内部调用的get/set方法
const get = (that, type) => that.$date[`get${capitalize(type)}`]() + Number(type === 'month');
const set = (that, type, ...input) => {
  // 输入为非数字直接返回此对象
  if (input.some(isNaN)) return that;
  // 处理原生月份的偏移量
  if (type === 'fullYear' && input.length > 1) input[1] -= 1;
  else if (type === 'month') input[0] -= 1;
  that.$date[`set${capitalize(type)}`](...input);
  return that;
};
const gs = (that, type, ...input) => (input.length && isDefined(input) ? set(that, type, ...input) : get(that, type));

class DateIO {
  constructor(input) {
    this.I18N = locale();
    this.init(input);
  }

  init(input) {
    this.$date = toDate(input);
    return this;
  }

  // 年
  // 100...2020
  y(...input) {
    return gs(this, 'fullYear', ...input);
  }

  // 年 (4位)
  // 0100...2020
  Y() {
    return zeroFill(this.y(), 4);
  }

  // 加偏移后的月
  // 1...12
  m(...input) {
    return gs(this, 'month', ...input);
  }

  // 月 (前导0)
  // 01...12
  M() {
    return zeroFill(this.m());
  }

  // 日
  // 1...31
  d(...input) {
    return gs(this, 'date', ...input);
  }

  // 日 (前导0)
  // 01...31
  D() {
    return zeroFill(this.d());
  }

  // 周几
  // 0...6
  w() {
    return gs(this, 'day');
  }

  // 周几
  // 本地化后的星期x
  W() {
    return this.I18N.weekdays[this.w()];
  }

  // 24小时制
  // 0...23
  h(...input) {
    return gs(this, 'hours', ...input);
  }

  // 24小时制 (前导0)
  // 00...23
  H() {
    return zeroFill(this.h());
  }

  // 分
  // 0...59
  i(...input) {
    return gs(this, 'minutes', ...input);
  }

  // 分 (前导0)
  // 00...59
  I() {
    return zeroFill(this.i());
  }

  // 秒
  // 0...59
  s(...input) {
    return gs(this, 'seconds', ...input);
  }

  // 秒 (前导0)
  // 00...59
  S() {
    return zeroFill(this.s());
  }

  // 毫秒数
  // 0...999
  ms(...input) {
    return gs(this, 'milliseconds', ...input);
  }

  MS() {
    return zeroFill(this.ms(), 3);
  }

  // 时间段
  a() {
    return this.I18N.interval[Math.floor((this.h() / 24) * this.I18N.interval.length)];
  }

  // 时间段
  A() {
    return this.a().toUpperCase();
  }

  // unix 偏移量 (毫秒)
  // 0...1571136267050
  u(...input) {
    return input.length ? this.init(input[0]) : this.valueOf();
  }

  // Unix 时间戳 (秒)
  // 0...1542759768
  U(...input) {
    return input.length ? this.init(input[0] * 1000) : Math.round(this / 1000);
  }

  // 获取以上格式的日期，每个unit对应其中一种格式
  get(unit = '') {
    return getUnitRegExp.test(unit) ? this[unit]() : undefined;
  }

  // 设置以上格式的日期
  set(unit = '', ...input) {
    return setUnitRegExp.test(unit) ? this[unit](...input) : this;
  }

  toDate() {
    return this.$date;
  }

  toString() {
    return this.$date.toString();
  }

  toLocaleString(...input) {
    return this.$date.toLocaleString(...input);
  }

  valueOf() {
    return this.$date.valueOf();
  }

  clone() {
    return new DateIO(+this.$date);
  }

  // 利用格式化串格式化日期
  format(formats) {
    return String(formats || 'Y-M-D H:I:S').replace(formatsRegExp, unit => this[unit]());
  }

  // 开始于，默认ms
  startOf(unit, isStartOf = true) {
    let formats = 'y m d h i s';
    formats = formats.slice(0, formats.indexOf(unit === 'w' ? 'd' : unit) + 1);
    if (!formats) return this;
    const dates = this.format(formats).split(' ');
    // 分别对应年/月/日/时/分/秒/毫秒
    const starts = [0, 1, 1, 0, 0, 0, 0];
    const ends = [0, 12, 0, 23, 59, 59, 999];
    const input = isStartOf ? starts : ends;
    input.splice(0, dates.length, ...dates);
    if (isStartOf || !/^[ym]$/.test(unit)) input[1] -= 1;
    if (unit === 'w') input[2] -= this.w() - (isStartOf ? 0 : 6);
    return this.init(input);
  }

  // 结束于，默认ms
  endOf(unit) {
    return this.startOf(unit, false);
  }

  // 返回两个日期的差值，精确到毫秒
  // unit: ms: milliseconds(default)|s: seconds|i: minutes|h: hours|d: days|w: weeks|m: months|y: years
  // isFloat: 是否返回小数
  diff(input, unit, isFloat = false) {
    const that = new DateIO(input);
    const md = monthDiff(this, that);
    let diff = this - that;
    if (/^[ym]$/.test(unit)) diff = md / unitStep[unit];
    else diff /= unitStep[unit] || 1;

    return isFloat ? diff : Math.trunc(diff);
  }

  // 对日期进行+-运算，默认精确到毫秒，可传小数
  // input: '7d', '-1m', '10y', '5.5h'等或数字。
  // unit: 'y', 'm', 'd', 'w', 'h', 'i', 's', 'ms'。
  add(input, unit) {
    const pattern = String(input).match(addUnitRegExp);
    if (!pattern) return this;

    const [, addend, addUnit = unit || 'ms'] = pattern;
    // 年月转化为月，并四舍五入
    if (/^[ym]$/.test(addUnit)) return this.set('m', this.m() + Number((addend * unitStep[addUnit]).toFixed(0)));
    return this.init(addend * (unitStep[addUnit] || 0) + this.valueOf());
  }

  subtract(input, unit) {
    return this.add(`-${input}`, unit);
  }

  // 是否为闰年
  isLeapYear() {
    const y = this.y();
    return y % 100 ? y % 4 === 0 : y % 400 === 0;
  }

  // 获取某月有多少天
  daysInMonth() {
    const monthDays = [31, 28 + Number(this.isLeapYear()), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return monthDays[this.m() - 1];
  }

  // 比较两个日期是否具有相同的年/月/日/时/分/秒，默认精确比较到毫秒
  isSame(input, unit) {
    return +this.clone().startOf(unit) === +new DateIO(input).startOf(unit);
  }
}

const dateio = input => new DateIO(input);

dateio.prototype = DateIO.prototype;
dateio.locale = locale;

export default dateio;
