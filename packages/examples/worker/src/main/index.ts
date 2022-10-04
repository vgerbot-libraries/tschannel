import { channel } from '@vgerbot/channel';
import { CHANNEL_ID } from '../common/consts';
import { UploadFunction } from '../common/UploadFunction';

const c = channel(CHANNEL_ID)
    .connectToWorker('/worker/index.js')
    .options({
        type: 'module'
    })
    .create();

const upload = c.get_method<UploadFunction>('upload');

upload(new ArrayBuffer(1024), ratio => {
    console.log('Uploading progress: ', ratio);
}).then(() => {
    console.log('Upload file success');
});
