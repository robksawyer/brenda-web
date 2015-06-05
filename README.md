# Brenda Web Interface
> The goal of this project is to create a web interface that allows users to easily submit and manage [Blender](http://www.blender.org/) render jobs submitted via [Amazon Web Services](http://aws.amazon.com/). And more specifically, via [Amazon EC2 Spot Intances](http://aws.amazon.com/ec2/purchasing-options/spot-instances/). Right now the backend heavily relies on the work done by James Yonan. See the github project, titled Brenda at [jamesyonan/brenda](https://github.com/jamesyonan/brenda).

[![Build Status](https://travis-ci.org/robksawyer/brenda-web.svg)](https://travis-ci.org/robksawyer/brenda-web) [![Code Climate](https://codeclimate.com/github/robksawyer/brenda-web/badges/gpa.svg)](https://codeclimate.com/github/robksawyer/brenda-web) [![Test Coverage](https://codeclimate.com/github/robksawyer/brenda-web/badges/coverage.svg)](https://codeclimate.com/github/robksawyer/brenda-web/coverage) [![Donate](https://img.shields.io/gratipay/robksawyer.svg)](https://gratipay.com/~robksawyer/)

# Milestones

[Beta 1.0 - Coming Late July](https://github.com/robksawyer/brenda-web/milestones/Beta%20Version%201.0)

# Getting Started

1. See the SailsJS [Getting Started](http://sailsjs.org/#!/getStarted). You mostly need to install nodejs.
1. `git clone https://github.com/robksawyer/brenda-web.git`
1. `cd brenda-web`
1. Rename `config/local.sample.js` to `config/local.js`. This contains local configuration variables that the app can use.
1. Run the command `npm install` to download the node modules used in the project.
1. Set Amazon keys as environment variables. See setting up [AWS](https://github.com/robksawyer/brenda-web#aws-amazon) below.
1. Open your Terminal ([iTerm 2](https://www.iterm2.com/))
1. Run the command `sails lift`
1. Navigate to `http://localhost:1337/register` and create an account.
1. Click your `username` in the navigation bar to enter the Settings page.

# Configuration

## AWS (Amazon Web Services)

The following environment variables need to be set.

Environment Variables
```
AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="YOUR_SECRET_ACCESS_KEY"
AWS_DEFAULT_REGION="us-west-2"
```

You could also just add the following to your `config/local.js` file.
```
aws: {
      credentials: {
        accessKeyId: 'YOUR_ACCESS_KEY',
        secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
        region: 'us-west-2'
      }
   }
```

# Technology Stack

## Web/NodeJS Framework
- [Sails](http://sailsjs.org)

## NPM Packages
- [skipper-s3](https://www.npmjs.com/package/skipper-s3): Streaming file uploads to S3
- [skipper-s3-alt](https://www.npmjs.com/package/skipper-s3-alt): An alternative skipper driver for upload files in AWS S3
- [aws-sdk](https://www.npmjs.com/package/aws-sdk): Amazon SDK for Node
- [knox](https://www.npmjs.com/package/knox): Amazon S3 client
- [aws-q](https://www.npmjs.com/package/aws-q): Give the AWS SDK some Q promise magic
- [adm-zip](https://www.npmjs.com/package/adm-zip): Automatically zipping .blend files in order to push to Amazon S3
- [moment](http://momentjs.com/) - Formatting time data


# Wuh? What is Brenda?
- [Blender Cycles Cloud Render Farming Using AWS, Deadline and Brenda](https://www.youtube.com/watch?v=NkZ60lF-nKM) is a great introduction to the software.
- [James Yonan – Build Your Own Low-Cost Yet Highly Scalable Blender Render Farm (BConf 2013)](http://www.youtube.com/watch?v=_Oqo383uviw)

# Resources
- [Brenda Pro Forum](http://brendapro.com/forum/) - A great resource to get started with Brenda.

# Inspiration
- [Render.st](https://render.st) - Good interface!
- [Flamenco](http://www.flamenco.io/)
- [Brender](http://www.brender-farm.org/) - I believe this became Flamenco.
