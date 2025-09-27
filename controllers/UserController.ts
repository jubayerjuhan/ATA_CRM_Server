import { NextFunction, Request, Response } from "express";

import User from "../models/user";
import Lead from "../models/lead";
import { AuthorizedRequest } from "../types";
import moment from "moment";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();

    const usersWithLeads = await Promise.all(
      users.map(async (user) => {
        const leads = await Lead.find({
          claimed_by: user._id,
          converted: false,
        });

        return {
          ...user.toObject(),
          leadsInProgress: leads.length,
        };
      })
    );

    res.status(200).json({
      status: "success",
      users: usersWithLeads,
    });
  } catch (error: any) {
    next(error);
  }
};

export const changeUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;
  const { role } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({ message: "User role updated successfully" });
  } catch (error: any) {
    next(error);
  }
};

export const getUsersOverview = async (
  req: AuthorizedRequest,
  res: Response
) => {
  const { startDate, endDate } = req.query;

  // Check if both startDate and endDate are provided
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ message: "Please provide both startDate and endDate" });
  }

  try {
    // Parse startDate and endDate using moment to ensure valid date objects
    const start = moment(startDate as string, moment.ISO_8601, true).startOf(
      "day"
    );
    const end = moment(endDate as string, moment.ISO_8601, true).endOf("day");

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Fetch all users
    const users = await User.find();

    // Prepare the result array
    const result = await Promise.all(
      users.map(async (user) => {
        // Fetch leads for the user within the date range
        const userLeads = await Lead.find({
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
          claimed_by: user._id,
        });

        // Fetch converted leads for the user within the date range
        const convertedLeads = await Lead.find({
          createdAt: {
            $gte: start.toDate(),
            $lte: end.toDate(),
          },
          claimed_by: user._id,
          converted: true,
        });

        // Calculate conversion rate
        const conversionRate =
          userLeads.length > 0
            ? (convertedLeads.length / userLeads.length) * 100
            : 0;

        return {
          user: user.toObject(),
          leadsInProgress: userLeads.length,
          convertedLeads: convertedLeads.length,
          conversionRate: conversionRate.toFixed(2) + "%",
        };
      })
    );

    // Return the result
    res.send(result);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsersOverviewOptimized = async (
  req: AuthorizedRequest,
  res: Response
) => {
  try {
    const { startDate, endDate, page = 1, limit = 20, search = "", sortBy = "user.name", sortOrder = "asc" } = req.query;

    // Check if both startDate and endDate are provided
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Please provide both startDate and endDate" });
    }

    // Parse startDate and endDate using moment to ensure valid date objects
    const start = moment(startDate as string, moment.ISO_8601, true).startOf("day");
    const end = moment(endDate as string, moment.ISO_8601, true).endOf("day");

    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build search query for user name or email
    const searchQuery = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Optimized aggregation pipeline
    const pipeline: any[] = [
      // Match users with search criteria if provided
      ...(search ? [{ $match: searchQuery }] : []),

      // Lookup leads for each user within the date range
      {
        $lookup: {
          from: "leads",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$claimed_by", "$$userId"] },
                    { $gte: ["$createdAt", start.toDate()] },
                    { $lte: ["$createdAt", end.toDate()] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                convertedLeads: {
                  $sum: { $cond: [{ $eq: ["$converted", true] }, 1, 0] },
                },
              },
            },
          ],
          as: "leadStats",
        },
      },

      // Add calculated fields
      {
        $addFields: {
          leadsInProgress: {
            $ifNull: [{ $arrayElemAt: ["$leadStats.totalLeads", 0] }, 0],
          },
          convertedLeads: {
            $ifNull: [{ $arrayElemAt: ["$leadStats.convertedLeads", 0] }, 0],
          },
        },
      },

      // Calculate conversion rate
      {
        $addFields: {
          conversionRate: {
            $cond: [
              { $gt: ["$leadsInProgress", 0] },
              {
                $concat: [
                  {
                    $toString: {
                      $round: [
                        {
                          $multiply: [
                            { $divide: ["$convertedLeads", "$leadsInProgress"] },
                            100,
                          ],
                        },
                        2,
                      ],
                    },
                  },
                  "%",
                ],
              },
              "0%",
            ],
          },
        },
      },

      // Remove the temporary leadStats field
      { $unset: "leadStats" },

      // Add sorting field based on request
      {
        $addFields: {
          sortField: {
            $switch: {
              branches: [
                { case: { $eq: [sortBy, "user.name"] }, then: "$name" },
                { case: { $eq: [sortBy, "leadsInProgress"] }, then: "$leadsInProgress" },
                { case: { $eq: [sortBy, "convertedLeads"] }, then: "$convertedLeads" },
                { case: { $eq: [sortBy, "conversionRate"] }, then: "$convertedLeads" }, // Sort by actual number for conversion rate
              ],
              default: "$name",
            },
          },
        },
      },

      // Sort by the specified field
      { $sort: { sortField: sortOrder === "asc" ? 1 : -1 } },

      // Remove the temporary sort field
      { $unset: "sortField" },
    ];

    // Get total count for pagination
    const totalCountPipeline = [...pipeline];
    totalCountPipeline.push({ $count: "total" });
    const totalCountResult = await User.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.total || 0;

    // Add pagination to the main pipeline
    const paginatedPipeline = [...pipeline];
    paginatedPipeline.push({ $skip: skip });
    paginatedPipeline.push({ $limit: limitNum });

    // Execute the aggregation
    const users = await User.aggregate(paginatedPipeline);

    // Format response to match the existing structure
    const result = users.map(user => ({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      leadsInProgress: user.leadsInProgress,
      convertedLeads: user.convertedLeads,
      conversionRate: user.conversionRate,
    }));

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      message: "Users overview retrieved successfully",
      users: result,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error("Error in getUsersOverviewOptimized:", error);
    res.status(500).json({
      message: "Failed to retrieve users overview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    next(error);
  }
};
