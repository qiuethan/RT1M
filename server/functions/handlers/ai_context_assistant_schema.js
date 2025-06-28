/**
 * Enhanced Context Assistant Schema for RT1M
 * Supports create, edit, delete operations for goals, assets, and debts
 * Includes submilestones support for goals
 */

export const contextAssistantSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Friendly, personalized response to the user in natural language"
    },
    
    // Financial Information (create/update only)
    income: {
      type: "number",
      minimum: 0,
      description: "Annual income if explicitly mentioned by user"
    },
    expenses: {
      type: "number",
      minimum: 0,
      description: "Annual expenses if explicitly mentioned by user"
    },
    savings: {
      type: "number",
      minimum: 0,
      description: "Current savings if explicitly mentioned by user"
    },
    
    // Assets (create new)
    assets: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Asset name"
          },
          type: {
            type: "string",
            enum: [
              "house",
              "car",
              "investment",
              "savings",
              "retirement",
              "other"
            ],
            description: "Asset category"
          },
          value: {
            type: "number",
            minimum: 0,
            description: "Current value"
          },
          description: {
            type: "string",
            description: "Optional description"
          }
        },
        required: [
          "name",
          "type",
          "value"
        ],
        additionalProperties: false
      },
      description: "New assets to add (only if user mentions new assets)"
    },
    
    // Debts (create new)  
    debts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Debt name"
          },
          type: {
            type: "string",
            enum: [
              "mortgage",
              "credit-card",
              "student-loan",
              "car-loan",
              "personal-loan",
              "business-loan",
              "other"
            ],
            description: "Debt category"
          },
          balance: {
            type: "number",
            minimum: 0,
            description: "Current balance"
          },
          interestRate: {
            type: "number",
            minimum: 0,
            description: "Interest rate percentage"
          },
          description: {
            type: "string",
            description: "Optional description"
          }
        },
        required: [
          "name",
          "type",
          "balance"
        ],
        additionalProperties: false
      },
      description: "New debts to add (only if user mentions new debts)"
    },
    
    // Goals (create new)
    goals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Goal title"
          },
          type: {
            type: "string",
            enum: [
              "financial",
              "skill",
              "behavior",
              "lifestyle",
              "networking",
              "project"
            ],
            description: "Goal category"
          },
          targetAmount: {
            type: "number",
            minimum: 0,
            description: "Target amount for financial goals"
          },
          currentAmount: {
            type: "number",
            minimum: 0,
            description: "Current progress amount"
          },
          targetDate: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "Target completion date (YYYY-MM-DD)"
          },
          status: {
            type: "string",
            enum: [
              "Not Started",
              "In Progress",
              "Completed"
            ],
            description: "Current status"
          },
          progress: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Progress percentage for non-financial goals"
          },
          description: {
            type: "string",
            description: "Goal description"
          },
          category: {
            type: "string",
            description: "Additional category info"
          },
          submilestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Submilestone title"
                },
                description: {
                  type: "string",
                  description: "Brief description"
                },
                targetAmount: {
                  type: "number",
                  minimum: 0,
                  description: "Target amount if financial"
                },
                targetDate: {
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  description: "Target date (YYYY-MM-DD)"
                },
                completed: {
                  type: "boolean",
                  description: "Whether completed"
                },
                order: {
                  type: "number",
                  minimum: 0,
                  description: "Order/sequence"
                }
              },
              required: [
                "title",
                "completed",
                "order"
              ],
              additionalProperties: false
            },
            description: "Optional submilestones to break down the goal"
          }
        },
        required: [
          "title",
          "type"
        ],
        additionalProperties: false
      },
      description: "New goals to add (only if user mentions new goals)"
    },
    
    // Skills (create new)
    skills: {
      type: "array",
      items: {
        type: "string"
      },
      description: "New skills to add (only if user mentions new skills)"
    },
    
    // EDIT/DELETE OPERATIONS
    operations: {
      type: "object",
      properties: {
        // Goal Operations
        goalEdits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Exact ID of goal to edit"
              },
              updates: {
                type: "object",
                properties: {
                  title: {
                    type: "string"
                  },
                  type: {
                    type: "string",
                    enum: [
                      "financial",
                      "skill",
                      "behavior",
                      "lifestyle",
                      "networking",
                      "project"
                    ]
                  },
                  targetAmount: {
                    type: "number",
                    minimum: 0
                  },
                  currentAmount: {
                    type: "number",
                    minimum: 0
                  },
                  targetDate: {
                    type: "string",
                    pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  status: {
                    type: "string",
                    enum: [
                      "Not Started",
                      "In Progress",
                      "Completed"
                    ]
                  },
                  progress: {
                    type: "number",
                    minimum: 0,
                    maximum: 100
                  },
                  description: {
                    type: "string"
                  },
                  category: {
                    type: "string"
                  },
                                     submilestones: {
                     type: "array",
                     items: {
                       type: "object",
                       properties: {
                         id: {
                           type: "string",
                           description: "ID of existing submilestone to update (required for edits)"
                         },
                         title: {
                           type: "string"
                         },
                         description: {
                           type: "string"
                         },
                         targetAmount: {
                           type: "number",
                           minimum: 0
                         },
                         targetDate: {
                           type: "string",
                           pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                         },
                         completed: {
                           type: "boolean"
                         },
                         order: {
                           type: "number",
                           minimum: 0,
                           description: "Order/sequence (can be used instead of ID for updates)"
                         }
                       },
                       additionalProperties: false,
                       description: "Individual submilestone updates - include ID or order to identify which submilestone to update"
                     },
                     description: "Array of submilestone updates - each item updates one specific submilestone"
                   }
                },
                additionalProperties: false,
                description: "Fields to update (only include changed fields)"
              }
            },
            required: [
              "id",
              "updates"
            ],
            additionalProperties: false
          },
          description: "Goals to edit by ID"
        },
        
        goalDeletes: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Goal IDs to delete"
        },
        
        // Asset Operations
        assetEdits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Exact ID of asset to edit"
              },
              updates: {
                type: "object",
                properties: {
                  name: {
                    type: "string"
                  },
                  type: {
                    type: "string",
                    enum: [
                      "house",
                      "car",
                      "investment",
                      "savings",
                      "retirement",
                      "other"
                    ]
                  },
                  value: {
                    type: "number",
                    minimum: 0
                  },
                  description: {
                    type: "string"
                  }
                },
                additionalProperties: false,
                description: "Fields to update (only include changed fields)"
              }
            },
            required: [
              "id",
              "updates"
            ],
            additionalProperties: false
          },
          description: "Assets to edit by ID"
        },
        
        assetDeletes: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Asset IDs to delete"
        },
        
        // Debt Operations
        debtEdits: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Exact ID of debt to edit"
              },
              updates: {
                type: "object",
                properties: {
                  name: {
                    type: "string"
                  },
                  type: {
                    type: "string",
                    enum: [
                      "mortgage",
                      "credit-card",
                      "student-loan",
                      "car-loan",
                      "personal-loan",
                      "business-loan",
                      "other"
                    ]
                  },
                  balance: {
                    type: "number",
                    minimum: 0
                  },
                  interestRate: {
                    type: "number",
                    minimum: 0
                  },
                  description: {
                    type: "string"
                  }
                },
                additionalProperties: false,
                description: "Fields to update (only include changed fields)"
              }
            },
            required: [
              "id",
              "updates"
            ],
            additionalProperties: false
          },
          description: "Debts to edit by ID"
        },
        
        debtDeletes: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Debt IDs to delete"
        }
      },
      additionalProperties: false,
      description: "Edit and delete operations (use exact IDs from context data)"
    }
  },
  required: ["message"],
  additionalProperties: false
};

// New dedicated schema for plan generation (focused on goal suggestions)
export const planAssistantSchema = {
  type: "object",
  properties: {
    message: {
      type: "string",
      description: "Explanatory message about the plan and suggested goals OR clarification questions"
    },
    
    needsClarification: {
      type: "boolean",
      description: "True if you need to ask clarification questions before generating a plan"
    },
    
    clarificationQuestions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "string"
      },
      description: "Up to 3 specific clarification questions to help generate a better plan"
    },
    
    planTitle: {
      type: "string",
      description: "Title for the overall plan/strategy (only include if not asking clarification)"
    },
    
    planDescription: {
      type: "string", 
      description: "Brief description of the overall strategy (only include if not asking clarification)"
    },
    
    suggestedGoals: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Clear, specific goal title"
          },
          type: {
            type: "string",
            enum: [
              "financial",
              "skill", 
              "behavior",
              "lifestyle",
              "networking",
              "project"
            ],
            description: "Goal category type"
          },
          targetAmount: {
            type: "number",
            minimum: 0,
            description: "Target amount for financial goals (optional, only for financial goals)"
          },
          targetDate: {
            type: "string",
            pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            description: "Target completion date in YYYY-MM-DD format (optional)"
          },
          status: {
            type: "string",
            enum: ["Not Started", "In Progress", "Completed"],
            description: "Goal status - use 'Not Started' for new suggested goals"
          },
          currentAmount: {
            type: "number",
            minimum: 0,
            description: "Current progress amount for financial goals (use 0 for new goals)"
          },
          progress: {
            type: "number",
            minimum: 0,
            maximum: 100,
            description: "Progress percentage for non-financial goals (use 0 for new goals)"
          },
          description: {
            type: "string",
            description: "Detailed description of what this goal involves and why it's important"
          },
          category: {
            type: "string",
            description: "Additional categorization or notes about the goal"
          },
          submilestones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Submilestone title"
                },
                description: {
                  type: "string",
                  description: "Brief description of this submilestone"
                },
                targetAmount: {
                  type: "number",
                  minimum: 0,
                  description: "Target amount for financial submilestones"
                },
                targetDate: {
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  description: "Target date for this submilestone (YYYY-MM-DD)"
                },
                completed: {
                  type: "boolean",
                  description: "Whether this submilestone is completed (use false for new ones)"
                },
                completedDate: {
                  type: "string",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                  description: "Date when submilestone was completed (optional)"
                },
                order: {
                  type: "number",
                  minimum: 0,
                  description: "Order/sequence of this submilestone"
                }
              },
              required: ["title", "completed", "order"],
              additionalProperties: false
            },
            description: "Optional submilestones to break down the goal into smaller steps"
          }
        },
        required: ["title", "type"],
        additionalProperties: false
      },
      description: "List of intermediate goals that match the exact IntermediateGoal schema"
    }
  },
  required: ["message", "needsClarification"],
  additionalProperties: false
};

