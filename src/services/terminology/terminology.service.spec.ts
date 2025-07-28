import { Test, TestingModule } from '@nestjs/testing';
import { TerminologyService } from './terminology.service';

describe('TerminologyService', () => {
  let service: TerminologyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TerminologyService],
    }).compile();

    service = module.get<TerminologyService>(TerminologyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
