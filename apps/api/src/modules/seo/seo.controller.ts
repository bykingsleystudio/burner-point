/**
 * apps/api/src/modules/seo/seo.controller.ts
 */
import { Controller, Get, Res, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('seo')
@Controller()
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get('sitemap.xml')
  @ApiOperation({ summary: 'XML sitemap for search engines' })
  sitemap(@Res() res: Response) {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(this.seoService.getSitemap());
  }

  @Get('robots.txt')
  @ApiOperation({ summary: 'Robots.txt for crawl control' })
  robots(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(this.seoService.getRobots());
  }

  @Get('structured-data')
  @ApiOperation({ summary: 'JSON-LD structured data for rich search results' })
  structuredData() {
    return this.seoService.getStructuredData();
  }

  @Post('admin/indexnow/ping')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Admin: Trigger IndexNow ping for specific URLs' })
  async pingIndexNow(@Body() body: { urls?: string[] }) {
    await this.seoService.pingIndexNow(body.urls);
    return { success: true };
  }
}
