import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformService } from './platform.service';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stack')
  @ApiOperation({ summary: 'Get the safe Burner Point stack registry and configuration status' })
  stack() {
    return this.platformService.getStack();
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Get stack readiness blockers without exposing secrets' })
  readiness() {
    return this.platformService.getReadiness();
  }

  @Get('deployment-readiness')
  @ApiOperation({ summary: 'Get deployment target readiness, release gates, and observability checks without exposing secrets' })
  deploymentReadiness() {
    return this.platformService.getDeploymentReadiness();
  }
}
