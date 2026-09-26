# Build stage - use Maven image directly
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:resolve -B 2>/dev/null || true

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Run stage - lightweight JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Add curl for health checks
RUN apk add --no-cache curl

COPY --from=build /app/target/*.jar app.jar

# Render uses PORT env variable
ENV PORT=8080
EXPOSE ${PORT}

# Use PORT from environment
ENTRYPOINT java -Dserver.port=${PORT} -Xmx512m -jar app.jar
