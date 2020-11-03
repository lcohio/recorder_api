'use strict';

const Context = require('./context');

class Database {
  constructor(seedData, enableLogging) {
    this.project = seedData.project;
    this.proposal = seedData.proposal;
    this.enableLogging = enableLogging;
    this.context = new Context('bid-entry-api.db', enableLogging);
  }

  log(message) {
    if (this.enableLogging) {
      console.info(message);
    }
  }

  tableExists(tableName) {
    this.log(`Checking if the ${tableName} table exists...`);

    return this.context
      .retrieveValue(`
        SELECT EXISTS (
          SELECT 1
          FROM sqlite_master
          WHERE type = 'table' AND name = ?
        );
      `, tableName);
  }

  createProject(project) {
    return this.context
      .execute(`
        INSERT INTO project
          (name, createdAt, updatedAt)
        VALUES
          (?, datetime('now'), datetime('now'));
      `,
      project.name);
  }

  createProposal(proposal) {
    return this.context
      .execute(`
        INSERT INTO proposal
          (companyName, contactName, address, city, state, zip, emailAddress, phoneNumber, createdAt, updatedAt)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')); 
      `,
      proposal.companyName,
      proposal.contactName,
      proposal.address,
      proposal.city,
      proposal.state,
      proposal.zip,
      proposal.emailAddress,
      proposal.phoneNumber,
      proposal.diversity,
      proposal.union,
      proposal.prevBidder);
  }

  async createProjects(projects) {
    for (const project of projects) {
      await this.createProject(project);
    }
  }

  async createProposals(proposals) {
    for (const proposal of proposals) {
      await this.createProposal(proposal);
    }
  }

  async init() {
    const projectTableExists = await this.tableExists('project');

    if (projectTableExists) {
      this.log('Dropping the project table....');

      await this.context.execute(`
        DROP TABLE IF EXISTS project;
      `);
    }

    this.log('Creating the project table...');

    await this.context.execute(`
      CREATE TABLE project (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL DEFAULT '',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);

    this.log('Creating the project records...');

    await this.createProjects(this.project);

    const proposalTableExists = await this.tableExists('proposal');

    if (proposalTableExists) {
      this.log('Dropping the proposal table...');

      await this.context.execute(`
        DROP TABLE IF EXISTS proposal;
      `);
    }

    this.log('Creating the proposal table...');

    await this.context.execute(`
      CREATE TABLE proposal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        companyName VARCHAR(255) NOT NULL DEFAULT '',
        contactName TEXT NOT NULL DEFAULT '',
        address VARCHAR(255) NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT '',
        zip INTEGER NOT NULL DEFAULT '',
        emailAddress TEXT NOT NULL DEFAULT '',
        phoneNumber VARCHAR(255) NOT NULL DEFAULT '',
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      );
    `);

    this.log('Creating the proposal records...');

    await this.createProposals(this.proposal);

    this.log('Database successfully initialized!');
  }
}

module.exports = Database;