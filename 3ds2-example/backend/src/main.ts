import { NestFactory } from "@nestjs/core";
import { PaymentsModule } from "./payments/payments.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(PaymentsModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT");
  await app.listen(port);
}
bootstrap();
