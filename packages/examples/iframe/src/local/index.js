import { Channel, ParameterType, WindowChannelCommunicator, RMIMethodMetadata } from '@vgerbot/channel';
const iframe = document.createElement('iframe');
iframe.src = '../remote/index.html';
iframe.onload = async () => {
    if (iframe.contentWindow === null) {
        console.error('Iframe is not load yet!');
        return;
    }
    const channel = new Channel('embed-iframe', new WindowChannelCommunicator(iframe.contentWindow));
    const RemoteClass = channel.get_class('ClassDefinedInIframe');
    const remoteInstance = new RemoteClass();
    await remoteInstance.hello();
    await channel.get_method(new RMIMethodMetadata('say_hello', {
        paramTypes: [
            ParameterType.remoteObject
        ]
    }))(remoteInstance);
    await channel.get_method('clear')(); // Executing remote method.
    await remoteInstance.__destroy__(); // Release the instance cache of the remote service(embed iframe);
    channel.destroy();
};
document.body.appendChild(iframe);
//# sourceMappingURL=index.js.map