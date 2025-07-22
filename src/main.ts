import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, "..", "static"));
  
  
  const config = new DocumentBuilder()
  .setTitle("Fhir Service")
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
