var gekkoConf = require('../core/util').getConfig();
var Discord = require('discord.js');
var log = require('../core/log');
var moment = require('moment');
var _ = require('lodash');
var utc = moment.utc;
var { discord: config } = gekkoConf;

const botAsset = gekkoConf.watch.asset;
const botCurrency = gekkoConf.watch.currency;

const strategy = gekkoConf.tradingAdvisor.method;
const market = gekkoConf.watch.exchange;

const bitcoinIcon =
  'https://cdn.iconscout.com/icon/free/png-32/bitcoin-259-646065.png';
const bitcoinColor = '#f2a900';

// Util function to display currency nicely
const currency = function(value, separator = ' ') {
  value = parseFloat(value);
  let symbol = '';

  if (botCurrency === 'EUR') symbol = '€';

  if (value === 0) return `0 ${symbol}`;
  else {
    value = value.toFixed(2);

    if (parseFloat(value) >= 1000)
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return `${value} ${symbol}`;
  }
};

// Util function to display asset nicely
const asset = function(value, separator = ' ') {
  value = parseFloat(value);
  let symbol = '';

  if (botAsset === 'BTC') symbol = 'Ƀ';

  if (value === 0) return `0 ${symbol}`;
  else {
    value = value.toFixed(8);

    if (parseFloat(value) >= 1000)
      value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    return `${value} ${symbol}`;
  }
};

// Util function to add basic info the an embed's footer
const footer = function() {
  return `Strategy: ${strategy} - Market: ${market}`;
};

var DiscordBot = function() {
  _.bindAll(this);

  this.client = new Discord.Client();

  this.isConnected = false;
  this.channel = false;

  this.client.on('ready', () => {
    log.debug('Discord bot ready');
    this.isConnected = true;

    this.channel = this.client.channels.get(config.channel);
  });

  this.client.on('disconnect', () => {
    this.isConnected = false;
  });

  this.client.on('reconnecting', () => {
    this.isConnected = false;
  });

  this.client.on('error', log.error);

  this.client
    .login(config.token)
    .then(() => {})
    .catch(log.error);
};

DiscordBot.prototype.processCandle = function(candle, done) {
  log.debug('Processed a new candle');

  this.advice = '';
  this.adviceTime = utc();

  done();
};

DiscordBot.prototype.processAdvice = function(advice) {
  log.debug('advice', advice);

  const { recommandation } = advice;

  if (recommandation === 'soft') return;
};

DiscordBot.prototype.processTradeCompleted = function(trade) {
  log.debug('trade', trade);

  const { action, price, amount, date, portfolio, balance } = trade;

  const message = `💵 Just made a trade for you boss`;
  const embed = this.embed(date.utc());

  embed.addField('Type', action.toUpperCase(), true);
  embed.addField('Amount', asset(amount), true);
  embed.addField('Price', currency(price), true);

  embed.addBlankField();

  embed.addField('Balance', currency(balance), true);
  embed.addField(botAsset, asset(portfolio.asset), true);
  embed.addField(botCurrency, currency(portfolio.currency), true);

  this.send(message, embed);
};

DiscordBot.prototype.processPerformanceReport = function(performance) {
  log.debug('performance', performance);

  const { profit, relativeProfit, trades } = performance;

  const relativeMessage =
    relativeProfit > 0
      ? "We're balling boss !"
      : 'Meh, shit happens alright .. ?';

  const message = `🎰 ${relativeMessage}`;
  const embed = this.embed();

  embed.addField('Profit', currency(profit), true);
  embed.addField('Profit %', `${relativeProfit.toFixed(2)} %`, true);
  embed.addField('# of trades', trades, true);

  this.send(message, embed);
};

DiscordBot.prototype.processStratWarmupCompleted = function(warmup) {
  log.info('Strat has warmed up boiz');
};

DiscordBot.prototype.send = function(msg = '', embed = false) {
  if (this.channel) this.channel.send(msg, embed);
  else
    log.error(
      "Couldn't send a message because we don't have channel to send to .."
    );
};

DiscordBot.prototype.embed = function(date = null) {
  const embed = new Discord.RichEmbed();

  // Date - Will use provided date if it's a moment object, use current's time if null or do nothing if date is set to false
  if (date !== false) {
    if (date === null) date = utc();
    else
      try {
        date = date.utc();
      } catch (e) {
        try {
          date = moment(date).utc();
        } catch (e) {}
      }

    embed.setTimestamp(date);
  }

  // Add basic info to footer
  embed.setFooter(footer(), bitcoinIcon);

  // Bitcoin's color for all embeds because Bitcoin is king
  embed.setColor(bitcoinColor);

  return embed;
};

module.exports = DiscordBot;
