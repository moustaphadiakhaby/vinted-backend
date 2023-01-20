const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const fileUpload = require("express-fileupload");
const isAuthenticated = require("../middlewares/isAuthenticated");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const Account = require("../models/Account");
const Offer = require("../models/Offer");

router.post(
  "/offer/publish",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const { account, _id } = req.user;

      if (title.length > 50) {
        return res.status(400).json({ message: "the title is too long" });
      }
      if (description.length > 500) {
        return res.status(400).json({ message: "the description is too long" });
      }
      if (price > 100000) {
        return res.status(400).json({ message: "the price is too high" });
      }

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        owner: _id,
      });

      if (req.files) {
        const result = await cloudinary.uploader.upload(
          convertToBase64(req.files.picture),
          {
            folder: "/vinted/offers/" + newOffer._id,
          }
        );
        newOffer.product_image = result;
      }

      await newOffer.save();

      const response = await Offer.findById(newOffer._id).populate(
        "owner",
        "account"
      );

      res.json(response);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.delete("/offer/delete", async (req, res) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.body.id);

    const publicId = offer.product_image.public_id;

    const destroyer = await cloudinary.uploader.destroy(publicId);

    const folderDelete = await cloudinary.api.delete_folder(
      "vinted/offers/" + req.body.id
    );

    await offer.delete();

    res.json({ message: "the publication has been deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/offer/edit", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const offer = await Offer.findById(req.body.id);

    if (req.files.picture) {
      const publicId = offer.product_image.public_id;
      const destroyer = await cloudinary.uploader.destroy(publicId);
      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        {
          folder: "/vinted/offers/" + req.body.id,
        }
      );
      offer.product_image = result;
    }

    if (req.body.title) {
      offer.product_name = req.body.title;
    }
    if (req.body.description) {
      offer.product_description = req.body.description;
    }
    if (req.body.price) {
      offer.product_price = req.body.price;
    }
    if (req.body.marque) {
      offer.product_details[0].MARQUE = req.body.marque;
    }
    if (req.body.taille) {
      offer.product_details[1].TAILLE = req.body.taille;
    }
    if (req.body.etat) {
      offer.product_details[2].ÉTAT = req.body.etat;
    }
    if (req.body.couleur) {
      offer.product_details[3].COULEUR = req.body.couleur;
    }
    if (req.body.emplacement) {
      offer.product_details[4].EMPLACEMENT = req.body.emplacement;
    }

    await offer.save();

    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMin, priceMax, sort } = req.query;
    let page = req.query.page;

    const empty = {};
    if (title) {
      const regex = new RegExp(title, "i", "g");

      empty.product_name = regex;
    }
    if (priceMin && priceMax) {
      empty.product_price = { $lte: priceMax, $gte: priceMin };
    } else if (priceMin) {
      empty.product_price = { $gte: priceMin };
    } else if (priceMax) {
      empty.product_price = { $lte: priceMax };
    }

    const emptySort = {};
    if (sort === "price-desc") {
      emptySort.product_price = -1;
    } else if (sort === "price-asc") {
      emptySort.product_price = 1;
    }

    const limitation = 5;
    let toSkip = 0;
    if (!page) {
      page = 1;
    } else if (Number(page) > 1) {
      for (let i = 0; i < page; i++) {
        toSkip += limitation;
      }
    }

    const result = await Offer.find(empty)
      .select("product_name product_price")
      .sort(emptySort)
      .limit(limitation)
      .skip(toSkip)
      .populate("owner", "account");

    const count = await Offer.countDocuments(empty);

    const response = {
      count: count,
      result: result,
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
