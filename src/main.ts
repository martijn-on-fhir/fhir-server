import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import {FsLoggerService} from "./services/logger/fs-logger.service";
import { FhirForbiddenExceptionFilter } from './filters/fhir-forbidden-exception.filter';
import {FhirBadRequestExceptionFilter} from "./filters/fhir-bad-request-exception.filter";

async function bootstrap(): Promise<void> {
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        logger: new FsLoggerService(),
  });
  
  app.use(helmet());
  app.useStaticAssets(join(__dirname, "..", "static"));
  
  app.useGlobalFilters(new FhirForbiddenExceptionFilter(),
      new FhirBadRequestExceptionFilter())
  
  const config = new DocumentBuilder()
  .setTitle("Fhir Server API")
  .setDescription("Opensource Fhir Server API")
  .setVersion("1.0")
  .setExternalDoc("Insomnia | Postman Collection", "./api-json")
  .setContact('Martijn on Fhir', 'https://github.com/martijn-on-fhir/fhir-server', '')
  .addServer("http://localhost:3000", "Local Development")
  .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    customSiteTitle: "Fhir Server API",
    customfavIcon: "./favicon.png",
    customCssUrl: ["/theme.css"],
    customJs: ["https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js", "adapcare.js"]
  });
  
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
