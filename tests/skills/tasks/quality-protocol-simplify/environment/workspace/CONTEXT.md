# Receiver protocol ownership

One receiver connection selects its protocol from the receiver model: R-A uses alpha; R-B uses beta. All handsets on that connection share this protocol regardless of reported handset model. Conflicting handset model data does not select a protocol. Mixed-protocol handsets on one receiver are outside this product contract.

Keep ReceiverSession(model, wire), register(handset), and send(targetIdsOrNull, text). Preserve multiple handset IDs, targeting and broadcast (null targets). Unknown targets reject before sending any packet. The existing codecs own encoding and are immutable. Simplify state and dispatch around the actual supported variation.
