import {
    Channel,
    WindowChannelCommunicator
} from '@tschannel/core';
import { CrossIframeClassInterface } from '../CrossIframeClassInterface';

const iframe = document.createElement('iframe');

iframe.src = '../remote/index.html';

iframe.onload = async () => {
    if (iframe.contentWindow === null) {
        console.error('Iframe is not load yet!');
        return;
    }
    const channel = new Channel(
        'embed-iframe',
        new WindowChannelCommunicator(iframe.contentWindow)
    );
    const RemoteClass = channel.rclass<CrossIframeClassInterface>('ClassDefinedInIframe', ['hello']);
    const remoteInstance = new RemoteClass();
    await remoteInstance.hello();

    await remoteInstance.__release__(); // Release the instance cache of the remote service(embed iframe);

    channel.rmethod('clear')(); // Executing remote method.

    channel.destroy();
};

document.body.appendChild(iframe);
