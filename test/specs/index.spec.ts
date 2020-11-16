import { RMI } from '../../src';
import { rclass } from '../../src/annotations/rclass';
import { rmethod } from '../../src/annotations/rmethod';
import LocalCommunicator from '../fixtures/communicator/LocalCommunicator';

describe('RMI', () => {
    it('should lclass works correctly', () => {
        const communicatorA = new LocalCommunicator();
        const communicatorB = new LocalCommunicator();
        communicatorA.connectTo(communicatorB);

        const rmiA = new RMI('local', communicatorA);
        const rmiB = new RMI('local', communicatorB);

        interface MD5Calculator {
            computeMD5(str: string): string;
        }
        @rclass({ id: 'remote-class' })
        class RemoteMD5Calculator implements MD5Calculator {
            constructor() {
                console.log();
            }
            @rmethod({})
            computeMD5(_: string): string {
                return '';
            }
        }

        class MD5CalculatorImpl implements MD5Calculator {
            computeMD5(str: string): string {
                return 'md5:' + str;
            }
        }
        rmiB.lclass('remote-class', MD5CalculatorImpl);
        const RClass = rmiA.rclass(RemoteMD5Calculator);

        const value = new RClass().computeMD5('123456');
        console.info(value);
    });
});
