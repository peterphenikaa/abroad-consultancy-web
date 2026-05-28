FROM maven:3.9.9-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app
COPY --from=build /app/target/payment-service.jar app.jar
USER app
EXPOSE 3008
ENV SERVER_PORT=3008
ENTRYPOINT ["java","-jar","/app/app.jar"]
