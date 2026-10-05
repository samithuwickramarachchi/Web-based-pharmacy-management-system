@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup batch script
@REM ----------------------------------------------------------------------------

@IF "%__MVNW_ARG0_NAME__%"=="" (SET "__MVNW_ARG0_NAME__=%~nx0")
@SET "__MVNW_CMD__=%COMSPEC%"
@IF "%COMSPEC%"=="" (@SET "__MVNW_CMD__=%SystemRoot%\System32\cmd.exe")
@SETLOCAL

@SET "PROJECT_DIR=%~dp0"
@IF "%PROJECT_DIR:~-1%"=="\" SET "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
@SET "__MVNW_WRAPPER_JAR__=%~dp0.mvn\wrapper\maven-wrapper.jar"
@SET "__MVNW_WRAPPER_PROPS__=%~dp0.mvn\wrapper\maven-wrapper.properties"

@REM Find JAVA_HOME
@IF NOT "%JAVA_HOME%"=="" (
  @SET "JAVA_HOME=%JAVA_HOME%"
  GOTO done_java_home
)

FOR /F "usebackq tokens=1,2,*" %%A IN (`REG QUERY "HKLM\Software\JavaSoft\JDK" /v CurrentVersion 2^>nul`) DO (
  @IF "%%A"=="CurrentVersion" SET "_java_ver=%%C"
)
IF DEFINED _java_ver (
  FOR /F "usebackq tokens=1,2,*" %%A IN (`REG QUERY "HKLM\Software\JavaSoft\JDK\%_java_ver%" /v JavaHome 2^>nul`) DO (
    @IF "%%A"=="JavaHome" SET "JAVA_HOME=%%C"
  )
)

:done_java_home
@SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
@IF NOT EXIST "%JAVA_EXE%" SET "JAVA_EXE=java"

@SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain
@SET DOWNLOAD_URL=https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar

@IF EXIST "%__MVNW_WRAPPER_JAR__%" (
  "%JAVA_EXE%" "-Dmaven.multiModuleProjectDirectory=%PROJECT_DIR%" -cp "%__MVNW_WRAPPER_JAR__%" %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*
) ELSE (
  echo Downloading Maven Wrapper JAR...
  powershell -Command "Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%__MVNW_WRAPPER_JAR__%'"
  "%JAVA_EXE%" "-Dmaven.multiModuleProjectDirectory=%PROJECT_DIR%" -cp "%__MVNW_WRAPPER_JAR__%" %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*
)

@ENDLOCAL
