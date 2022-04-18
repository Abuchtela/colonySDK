import { providers, utils } from 'ethers';

import { ColonyEvents } from '../../../src';
import type { ColonyEvent } from '../../../src';

const provider = new providers.JsonRpcProvider('https://xdai.colony.io/rpc2/');
const { isAddress } = utils;

// This event listener will only list for the `DomainAdded` event in the Colony of the user's choice. Run this and then create a Team in that Colony, to see it being picked up here
const setupEventListener = (
  colonyAddress: string,
  callback: (events: ColonyEvent[]) => void,
) => {
  const colonyEvents = new ColonyEvents(provider);

  const domainAdded = colonyEvents.createMultiFilter(
    colonyEvents.eventSources.Colony,
    'DomainAdded(address,uint256)',
    colonyAddress,
  );

  colonyEvents.provider.on('block', async (no) => {
    const events = await colonyEvents.getMultiEvents([domainAdded], {
      fromBlock: no,
      toBlock: no,
    });
    if (events.length) callback(events);
  });
};

// Just some basic setup to display the UI
const addressInput: HTMLInputElement = document.querySelector('#address');
const button = document.querySelector('#button');
const errElm: HTMLParagraphElement = document.querySelector('#error');
const resultElm: HTMLParagraphElement = document.querySelector('#result');

const panik = (err: string) => {
  errElm.innerText = err;
};
const kalm = () => {
  errElm.innerText = '';
};
const speak = (msg: string) => {
  resultElm.innerText = msg;
};

button.addEventListener('click', async () => {
  kalm();
  const colonyAddress = addressInput.value;
  if (!isAddress(colonyAddress)) {
    return panik('This is not a valid address');
  }
  addressInput.value = '';
  setupEventListener(colonyAddress, (events) => {
    speak(
      `A domain with id ${events[0].data.domainId} was created on Colony ${events[0].address}`,
    );
  });
  speak(`Set up event listener for Colony ${colonyAddress}`);
  return null;
});
