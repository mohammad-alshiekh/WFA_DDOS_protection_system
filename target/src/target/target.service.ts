import { Injectable } from '@nestjs/common';

@Injectable()
export class TargetService {
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cpuIntensive(): number {
    let result = 0;
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i) * Math.sin(i);
    }
    return result;
  }
}
