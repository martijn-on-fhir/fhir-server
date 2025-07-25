"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, "..", "static"));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Fhir Service")
        .setVersion("1.0")
        .setExternalDoc("Insomnia | Postman Collection", "./api-json")
        .setContact('Martijn on Fhir', 'https://github.com/martijn-on-fhir/fhir-server', '')
        .addServer("http://localhost:3000", "Local Development")
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api", app, document, {
        customSiteTitle: "Fhir Server API",
        customfavIcon: "./favicon.png",
        customCssUrl: ["/theme.css"],
        customJs: ["https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js", "adapcare.js"]
    });
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map