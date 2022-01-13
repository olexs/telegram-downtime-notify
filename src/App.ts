import * as dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import * as ping from 'ping';
import log, { LogLevelDesc } from 'loglevel';

interface Host {
    name: string;
    state: HostState;
    lastStateChange: Date;
    offlineCounter: number;
}

enum HostState {
    ONLINE = "online",
    OFFLINE = "offline",
    UNKNOWN = "unknown"
}

function getIcon(state: HostState): string {
    if (state === HostState.ONLINE) return "🟢";
    if (state === HostState.OFFLINE) return "🔴";
    else return "❓";
}

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const chatId = process.env.BOT_CHAT_ID;
const hosts = initializeHosts(); 
const delaySeconds = process.env.CHECK_PERIOD ? parseInt(process.env.CHECK_PERIOD) : 5;
const offlineThreshold = process.env.OFFLINE_THRESHOLD ? parseInt(process.env.OFFLINE_THRESHOLD) : 3;

const bot = new Telegraf(botToken);

startup();

function sendMessage(message: string) {
    try {
        bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch(e: any) {
        console.error(`error while trying to send Telegram notification:`, e);
    }
}

function startup(): void {
    log.setLevel(process.env.LOG_LEVEL as LogLevelDesc ?? 'WARN');
    log.info("startup");

    bot.launch();
    sendMessage("⏰ Downtime monitor starting up...");

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));

    initializeHosts();
    checkHosts();

    log.debug("startup finished");
}

function shutdown(signal: string) {
    log.info("shutdown");
    sendMessage("💤 Downtime monitor shutting down.");
    bot.stop(signal);
}

function initializeHosts(): Host[] {
    const hostNames = process.env.HOSTS.split(",");

    log.info("initializing hosts", hostNames);

    return hostNames.map((hostName) => ({
        name: hostName,
        state: HostState.UNKNOWN,
        lastStateChange: new Date(),
        offlineCounter: 0
    }));
}

async function checkHosts() {
    log.debug("checking all hosts");
    await Promise.all(hosts.map(checkHost));
    setTimeout(() => checkHosts(), delaySeconds * 1000);
    log.debug("scheduled next check in " + delaySeconds + " seconds");
}

async function checkHost(host: Host): Promise<void> {
    var isAlive = true;
    try {
        const pingResult = await ping.promise.probe(host.name);
        isAlive = pingResult.alive;
    } catch(e: any) {
        log.error(`probe error for ${host.name}:`, e);
        isAlive = false;
    }

    let newState = host.state;

    if (isAlive) {
        host.offlineCounter = 0;
        newState = HostState.ONLINE;
    } else {
        host.offlineCounter++;
        if (host.offlineCounter >= offlineThreshold) {
            newState = HostState.OFFLINE;
        } else {
            log.info(`probe returned offline for ${host.name}, counter: ${host.offlineCounter} / ${offlineThreshold}`)
        }
    }

    if (newState !== host.state) {
        log.info(`state change: ${host.name} ${host.state} -> ${newState}`);  

        let message = `${getIcon(newState)} *${host.name}* is now *${newState}*`;
        if (newState === HostState.OFFLINE) {
            message += ` after ${offlineThreshold} failed probes`
        }
        if (host.state !== HostState.UNKNOWN) {
            message += `. Previously *${host.state}* since ${host.lastStateChange.toLocaleString()}.`;
        }

        sendMessage(message);

        host.state = newState;
        host.lastStateChange = new Date();
    }
}

